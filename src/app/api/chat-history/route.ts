import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Fetch all chat sessions for the current user
export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const chatSessions = await prisma.chatSession.findMany({
            where: { userId: session.user.id },
            include: {
                messages: {
                    orderBy: { createdAt: "asc" },
                },
            },
            orderBy: { updatedAt: "desc" },
        })

        return NextResponse.json(chatSessions)
    } catch (error) {
        console.error("Error fetching chat sessions:", error)
        return NextResponse.json({ error: "Failed to fetch chat sessions" }, { status: 500 })
    }
}

// POST - Create a new chat session
export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { title } = await req.json()

        const chatSession = await prisma.chatSession.create({
            data: {
                title: title || "New Chat",
                userId: session.user.id,
                messages: {
                    create: {
                        role: "assistant",
                        content: "Hi there! I'm your personal AI assistant. I can help you stay motivated, plan your tasks, suggest time management strategies, and answer questions. What would you like help with today?",
                    },
                },
            },
            include: {
                messages: true,
            },
        })

        return NextResponse.json(chatSession)
    } catch (error) {
        console.error("Error creating chat session:", error)
        return NextResponse.json({ error: "Failed to create chat session" }, { status: 500 })
    }
}
