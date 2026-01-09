import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (session.user.role !== "COUNSELOR") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const individuals = await prisma.user.findMany({
            where: { counselorId: session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                tasks: {
                    select: {
                        id: true,
                        completed: true,
                    },
                },
            },
        })

        const formattedIndividuals = individuals.map((ind) => ({
            id: ind.id,
            name: ind.name,
            email: ind.email,
            totalTasks: ind.tasks.length,
            completedTasks: ind.tasks.filter((t) => t.completed).length,
        }))

        const totalCompleted = formattedIndividuals.reduce((sum, ind) => sum + ind.completedTasks, 0)
        const totalTasks = formattedIndividuals.reduce((sum, ind) => sum + ind.totalTasks, 0)
        const averageCompletion = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0

        return NextResponse.json({
            individuals: formattedIndividuals,
            totalCompleted,
            averageCompletion,
        })
    } catch (error) {
        console.error("Error fetching individuals:", error)
        return NextResponse.json({ error: "Failed to fetch individuals" }, { status: 500 })
    }
}
