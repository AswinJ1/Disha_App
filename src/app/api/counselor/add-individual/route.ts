import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Add an existing individual to counselor
export async function POST(request: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (session.user.role !== "COUNSELOR") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { email } = await request.json()

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 })
        }

        // Find the individual by email
        const individual = await prisma.user.findFirst({
            where: {
                email,
                role: "INDIVIDUAL",
            },
        })

        if (!individual) {
            return NextResponse.json({ error: "Individual not found with this email" }, { status: 404 })
        }

        if (individual.counselorId === session.user.id) {
            return NextResponse.json({ error: "This individual is already assigned to you" }, { status: 400 })
        }

        if (individual.counselorId) {
            return NextResponse.json({ error: "This individual is already assigned to another counselor" }, { status: 400 })
        }

        // Assign the individual to this counselor
        const updatedIndividual = await prisma.user.update({
            where: { id: individual.id },
            data: { counselorId: session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
            },
        })

        // Send a notification to the individual
        await prisma.notification.create({
            data: {
                message: `${session.user.name} has added you as their individual. They can now view your tasks and provide feedback.`,
                type: "FEEDBACK",
                userId: individual.id,
            },
        })

        return NextResponse.json(updatedIndividual)
    } catch (error) {
        console.error("Error adding individual:", error)
        return NextResponse.json({ error: "Failed to add individual" }, { status: 500 })
    }
}

// Remove individual from counselor
export async function DELETE(request: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (session.user.role !== "COUNSELOR") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const individualId = searchParams.get("id")

        if (!individualId) {
            return NextResponse.json({ error: "Individual ID is required" }, { status: 400 })
        }

        // Verify the individual belongs to this counselor
        const individual = await prisma.user.findFirst({
            where: {
                id: individualId,
                counselorId: session.user.id,
            },
        })

        if (!individual) {
            return NextResponse.json({ error: "Individual not found" }, { status: 404 })
        }

        // Remove the counselor assignment
        await prisma.user.update({
            where: { id: individualId },
            data: { counselorId: null },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error removing individual:", error)
        return NextResponse.json({ error: "Failed to remove individual" }, { status: 500 })
    }
}
