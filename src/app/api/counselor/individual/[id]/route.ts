import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (session.user.role !== "COUNSELOR") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { id } = await params

        const individual = await prisma.user.findFirst({
            where: {
                id,
                counselorId: session.user.id,
            },
            select: {
                id: true,
                name: true,
                email: true,
                tasks: {
                    orderBy: { date: "desc" },
                },
                feedbackReceived: {
                    orderBy: { createdAt: "desc" },
                },
            },
        })

        if (!individual) {
            return NextResponse.json({ error: "Individual not found" }, { status: 404 })
        }

        return NextResponse.json(individual)
    } catch (error) {
        console.error("Error fetching individual:", error)
        return NextResponse.json({ error: "Failed to fetch individual" }, { status: 500 })
    }
}
