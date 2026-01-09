import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getRandomQuote } from "@/lib/ai"

export async function POST() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Find users with incomplete tasks for today
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const endOfDay = new Date(today)
        endOfDay.setHours(23, 59, 59, 999)

        const usersWithIncompleteTasks = await prisma.user.findMany({
            where: {
                role: "INDIVIDUAL",
                tasks: {
                    some: {
                        date: { gte: today, lte: endOfDay },
                        completed: false,
                    },
                },
            },
            include: {
                tasks: {
                    where: {
                        date: { gte: today, lte: endOfDay },
                        completed: false,
                    },
                },
            },
        })

        const quote = getRandomQuote()
        const notificationsCreated: string[] = []

        for (const user of usersWithIncompleteTasks) {
            const incompleteCount = user.tasks.length

            await prisma.notification.create({
                data: {
                    message: `📋 You have ${incompleteCount} task${incompleteCount > 1 ? "s" : ""} remaining today! "${quote.quote}" - ${quote.author}`,
                    type: "REMINDER",
                    userId: user.id,
                },
            })

            notificationsCreated.push(user.id)
        }

        return NextResponse.json({
            success: true,
            notificationsSent: notificationsCreated.length,
        })
    } catch (error) {
        console.error("Error creating reminder notifications:", error)
        return NextResponse.json({ error: "Failed to create notifications" }, { status: 500 })
    }
}
