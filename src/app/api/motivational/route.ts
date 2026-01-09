import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Default motivational quotes to use if database is empty
const DEFAULT_QUOTES = [
    { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
    { quote: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
    { quote: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
    { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { quote: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { quote: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
    { quote: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
]

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Try to get quotes from database
        let quotes = await prisma.motivationalQuote.findMany()

        // If no quotes in database, seed with defaults
        if (quotes.length === 0) {
            await prisma.motivationalQuote.createMany({
                data: DEFAULT_QUOTES.map(q => ({ quote: q.quote, author: q.author })),
            })
            quotes = await prisma.motivationalQuote.findMany()
        }

        // Get random quote
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)]

        // Get pending tasks count to personalize the message
        const pendingTasks = await prisma.task.count({
            where: {
                userId: session.user.id,
                status: { not: "DONE" },
                completed: false,
            },
        })

        // Get completed tasks today
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const completedToday = await prisma.task.count({
            where: {
                userId: session.user.id,
                completedAt: { gte: today },
            },
        })

        // Create personalized message
        let personalMessage = ""
        if (completedToday > 0) {
            personalMessage = `🎉 Amazing! You've completed ${completedToday} task${completedToday > 1 ? 's' : ''} today!`
        } else if (pendingTasks > 0) {
            personalMessage = `📋 You have ${pendingTasks} task${pendingTasks > 1 ? 's' : ''} waiting. You've got this!`
        }

        return NextResponse.json({
            quote: randomQuote.quote,
            author: randomQuote.author,
            personalMessage,
            pendingTasks,
            completedToday,
        })
    } catch (error) {
        console.error("Error fetching motivational quote:", error)
        // Return a default quote on error
        const fallback = DEFAULT_QUOTES[Math.floor(Math.random() * DEFAULT_QUOTES.length)]
        return NextResponse.json({
            quote: fallback.quote,
            author: fallback.author,
        })
    }
}
