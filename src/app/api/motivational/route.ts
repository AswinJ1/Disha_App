import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Fallback quote in case the API fails
const FALLBACK_QUOTE = { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" }

// Fetch a random quote from ZenQuotes API
async function fetchZenQuote(): Promise<{ quote: string; author: string }> {
    try {
        const response = await fetch("https://zenquotes.io/api/random", {
            next: { revalidate: 0 }, // Don't cache, get fresh quote each time
        })
        
        if (!response.ok) {
            throw new Error("Failed to fetch quote from ZenQuotes")
        }
        
        const data = await response.json()
        // ZenQuotes returns an array with one quote object: [{ q: "quote", a: "author", h: "html" }]
        if (data && data[0]) {
            return {
                quote: data[0].q,
                author: data[0].a,
            }
        }
        throw new Error("Invalid response format from ZenQuotes")
    } catch (error) {
        console.error("Error fetching from ZenQuotes:", error)
        return FALLBACK_QUOTE
    }
}

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Fetch random quote from ZenQuotes API
        const randomQuote = await fetchZenQuote()

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
        // Return a fallback quote on error
        return NextResponse.json({
            quote: FALLBACK_QUOTE.quote,
            author: FALLBACK_QUOTE.author,
        })
    }
}
