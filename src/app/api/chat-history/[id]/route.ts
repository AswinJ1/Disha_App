import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET - Fetch a specific chat session
export async function GET(req: Request, { params }: RouteParams) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params

        const chatSession = await prisma.chatSession.findFirst({
            where: {
                id,
                userId: session.user.id,
            },
            include: {
                messages: {
                    orderBy: { createdAt: "asc" },
                },
            },
        })

        if (!chatSession) {
            return NextResponse.json({ error: "Chat session not found" }, { status: 404 })
        }

        return NextResponse.json(chatSession)
    } catch (error) {
        console.error("Error fetching chat session:", error)
        return NextResponse.json({ error: "Failed to fetch chat session" }, { status: 500 })
    }
}

// POST - Add a message to a chat session
export async function POST(req: Request, { params }: RouteParams) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params
        const { role, content } = await req.json()

        // Verify ownership
        const chatSession = await prisma.chatSession.findFirst({
            where: {
                id,
                userId: session.user.id,
            },
        })

        if (!chatSession) {
            return NextResponse.json({ error: "Chat session not found" }, { status: 404 })
        }

        // Add message
        const message = await prisma.chatMessage.create({
            data: {
                role,
                content,
                sessionId: id,
            },
        })

        // Update session title if this is the first user message
        const messageCount = await prisma.chatMessage.count({
            where: { sessionId: id, role: "user" },
        })

        if (messageCount === 1 && role === "user") {
            // Set title from first user message (truncate if needed)
            await prisma.chatSession.update({
                where: { id },
                data: {
                    title: content.substring(0, 50) + (content.length > 50 ? "..." : ""),
                    updatedAt: new Date(),
                },
            })
        } else {
            // Just update the timestamp
            await prisma.chatSession.update({
                where: { id },
                data: { updatedAt: new Date() },
            })
        }

        return NextResponse.json(message)
    } catch (error) {
        console.error("Error adding message:", error)
        return NextResponse.json({ error: "Failed to add message" }, { status: 500 })
    }
}

// DELETE - Delete a chat session
export async function DELETE(req: Request, { params }: RouteParams) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params

        // Verify ownership and delete
        const chatSession = await prisma.chatSession.findFirst({
            where: {
                id,
                userId: session.user.id,
            },
        })

        if (!chatSession) {
            return NextResponse.json({ error: "Chat session not found" }, { status: 404 })
        }

        await prisma.chatSession.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting chat session:", error)
        return NextResponse.json({ error: "Failed to delete chat session" }, { status: 500 })
    }
}
