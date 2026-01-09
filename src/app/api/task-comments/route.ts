import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Fetch comments for a specific task
export async function GET(request: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const taskId = searchParams.get("taskId")

        if (!taskId) {
            return NextResponse.json({ error: "Task ID is required" }, { status: 400 })
        }

        // Verify the task belongs to the user or the user is the counselor
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: { user: true },
        })

        if (!task) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 })
        }

        // Allow access if user owns the task or is the counselor
        const isOwner = task.userId === session.user.id
        const isCounselor = task.user.counselorId === session.user.id

        if (!isOwner && !isCounselor) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        const comments = await prisma.taskComment.findMany({
            where: { taskId },
            include: {
                author: {
                    select: { name: true, role: true },
                },
            },
            orderBy: { createdAt: "desc" },
        })

        return NextResponse.json(comments)
    } catch (error) {
        console.error("Error fetching task comments:", error)
        return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
    }
}

// POST - Create a new comment on a task (counselors only)
export async function POST(request: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (session.user.role !== "COUNSELOR") {
            return NextResponse.json({ error: "Only counselors can add comments" }, { status: 403 })
        }

        const { taskId, message } = await request.json()

        if (!taskId || !message) {
            return NextResponse.json({ error: "Task ID and message are required" }, { status: 400 })
        }

        // Verify the task belongs to one of this counselor's individuals
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: { user: true },
        })

        if (!task) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 })
        }

        if (task.user.counselorId !== session.user.id) {
            return NextResponse.json({ error: "You can only comment on your individuals' tasks" }, { status: 403 })
        }

        const comment = await prisma.taskComment.create({
            data: {
                message,
                taskId,
                authorId: session.user.id,
            },
            include: {
                author: {
                    select: { name: true, role: true },
                },
            },
        })

        // Create notification for the individual
        await prisma.notification.create({
            data: {
                message: `New comment on "${task.title}": "${message.substring(0, 40)}${message.length > 40 ? "..." : ""}"`,
                type: "FEEDBACK",
                userId: task.userId,
            },
        })

        return NextResponse.json(comment)
    } catch (error) {
        console.error("Error creating task comment:", error)
        return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
    }
}
