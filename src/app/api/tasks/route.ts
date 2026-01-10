import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getMotivationalMessage } from "@/lib/ai"

export async function GET(request: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const date = searchParams.get("date")

        const where: { userId: string; date?: { gte: Date; lt: Date } } = {
            userId: session.user.id,
        }

        if (date) {
            const startDate = new Date(date)
            startDate.setHours(0, 0, 0, 0)
            const endDate = new Date(startDate)
            endDate.setDate(endDate.getDate() + 1)
            where.date = { gte: startDate, lt: endDate }
        }

        const tasks = await prisma.task.findMany({
            where,
            orderBy: { createdAt: "asc" },
            include: {
                comments: {
                    include: {
                        author: {
                            select: { name: true },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                },
            },
        })

        return NextResponse.json(tasks)
    } catch (error) {
        console.error("Error fetching tasks:", error)
        return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { title, description, date, estimatedMinutes } = await request.json()

        // Parse date string (yyyy-MM-dd) and set to noon to avoid timezone issues
        const taskDate = new Date(date)
        taskDate.setHours(12, 0, 0, 0)

        const task = await prisma.task.create({
            data: {
                title,
                description,
                date: taskDate,
                status: "TODO",
                estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
                userId: session.user.id,
            },
        })

        return NextResponse.json(task)
    } catch (error) {
        console.error("Error creating task:", error)
        return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id, status, completed, actualMinutes, startedAt, title, description, estimatedMinutes } = await request.json()

        const updateData: {
            status?: string
            completed?: boolean
            completedAt?: Date | null
            aiReward?: string
            actualMinutes?: number
            startedAt?: Date | null
            title?: string
            description?: string
            estimatedMinutes?: number | null
        } = {}

        if (status !== undefined) {
            updateData.status = status

            if (status === "IN_PROGRESS" && !startedAt) {
                updateData.startedAt = new Date()
            }

            if (status === "DONE") {
                updateData.completed = true
                updateData.completedAt = new Date()

                // Get task title for AI reward
                const existingTask = await prisma.task.findUnique({ where: { id } })
                if (existingTask) {
                    updateData.aiReward = getMotivationalMessage(existingTask.title)
                }
            } else {
                updateData.completed = false
                updateData.completedAt = null
            }
        }

        if (completed !== undefined) {
            updateData.completed = completed
            updateData.completedAt = completed ? new Date() : null
            updateData.status = completed ? "DONE" : "TODO"

            if (completed) {
                const existingTask = await prisma.task.findUnique({ where: { id } })
                if (existingTask) {
                    updateData.aiReward = getMotivationalMessage(existingTask.title)
                }
            }
        }

        if (actualMinutes !== undefined) {
            updateData.actualMinutes = parseInt(actualMinutes)
        }

        if (startedAt !== undefined) {
            updateData.startedAt = startedAt ? new Date(startedAt) : null
        }

        // Edit fields
        if (title !== undefined) {
            updateData.title = title
        }

        if (description !== undefined) {
            updateData.description = description
        }

        if (estimatedMinutes !== undefined) {
            updateData.estimatedMinutes = estimatedMinutes ? parseInt(estimatedMinutes) : null
        }

        const task = await prisma.task.update({
            where: { id },
            data: updateData,
        })

        return NextResponse.json(task)
    } catch (error) {
        console.error("Error updating task:", error)
        return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")

        if (!id) {
            return NextResponse.json({ error: "Task ID required" }, { status: 400 })
        }

        await prisma.task.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting task:", error)
        return NextResponse.json({ error: "Failed to delete task" }, { status: 500 })
    }
}
