import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const notifications = await prisma.notification.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            take: 20,
        })

        const unreadCount = await prisma.notification.count({
            where: { userId: session.user.id, read: false },
        })

        return NextResponse.json({ notifications, unreadCount })
    } catch (error) {
        console.error("Error fetching notifications:", error)
        return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id, markAllRead } = await request.json()

        if (markAllRead) {
            await prisma.notification.updateMany({
                where: { userId: session.user.id, read: false },
                data: { read: true },
            })
        } else if (id) {
            await prisma.notification.update({
                where: { id },
                data: { read: true },
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error updating notifications:", error)
        return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 })
    }
}
