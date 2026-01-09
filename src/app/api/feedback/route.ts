import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (session.user.role !== "COUNSELOR") {
            return NextResponse.json({ error: "Only counselors can send feedback" }, { status: 403 })
        }

        const { individualId, message } = await request.json()

        if (!individualId || !message) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // Verify this individual belongs to this counselor
        const individual = await prisma.user.findFirst({
            where: {
                id: individualId,
                counselorId: session.user.id,
            },
        })

        if (!individual) {
            return NextResponse.json({ error: "Individual not found" }, { status: 404 })
        }

        const feedback = await prisma.feedback.create({
            data: {
                message,
                counselorId: session.user.id,
                individualId,
            },
        })

        // Create notification for the individual
        await prisma.notification.create({
            data: {
                message: `New feedback from your counselor: "${message.substring(0, 50)}${message.length > 50 ? "..." : ""}"`,
                type: "FEEDBACK",
                userId: individualId,
            },
        })

        return NextResponse.json(feedback)
    } catch (error) {
        console.error("Error creating feedback:", error)
        return NextResponse.json({ error: "Failed to create feedback" }, { status: 500 })
    }
}

export async function GET(request: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get feedback for individual user
        const feedback = await prisma.feedback.findMany({
            where: { individualId: session.user.id },
            include: {
                counselor: {
                    select: { name: true },
                },
            },
            orderBy: { createdAt: "desc" },
        })

        return NextResponse.json(feedback)
    } catch (error) {
        console.error("Error fetching feedback:", error)
        return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 })
    }
}
