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

        // Fetch all individuals assigned to this counselor with their tasks
        const individuals = await prisma.user.findMany({
            where: { counselorId: session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                tasks: {
                    select: {
                        id: true,
                        status: true,
                        completed: true,
                        actualMinutes: true,
                        estimatedMinutes: true,
                    },
                },
            },
        })

        // Calculate metrics for each individual
        const leaderboardData = individuals.map((ind) => {
            const completedTasks = ind.tasks.filter((t) => t.completed || t.status === "DONE").length
            const pendingTasks = ind.tasks.filter((t) => !t.completed && t.status !== "DONE").length
            const totalTasks = ind.tasks.length

            // Sum actual and estimated minutes from all tasks
            const actualMinutes = ind.tasks.reduce((sum, t) => sum + (t.actualMinutes || 0), 0)
            const estimatedMinutes = ind.tasks.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0)

            // Calculate efficiency score (higher is better)
            // If actual time <= estimated time, that's good (efficiency >= 100%)
            // Formula: (estimatedMinutes / actualMinutes) * 100, capped at 200%
            let efficiency = 0
            if (actualMinutes > 0 && estimatedMinutes > 0) {
                efficiency = Math.min((estimatedMinutes / actualMinutes) * 100, 200)
            } else if (completedTasks > 0 && actualMinutes === 0) {
                // Completed tasks with no time tracked - neutral
                efficiency = 100
            }

            // Calculate composite score for ranking
            // Weighted formula:
            // - Completed tasks: 40% weight (more completed = higher score)
            // - Efficiency: 35% weight (better time management = higher score)
            // - Fewer pending tasks: 25% weight (fewer pending = higher score)
            const maxPossiblePending = Math.max(...individuals.map(i => 
                i.tasks.filter(t => !t.completed && t.status !== "DONE").length
            ), 1)
            
            const completionScore = completedTasks * 10 // 10 points per completed task
            const efficiencyScore = efficiency // Already 0-200 scale
            const pendingScore = ((maxPossiblePending - pendingTasks) / maxPossiblePending) * 100 // 0-100 scale

            const compositeScore = (completionScore * 0.4) + (efficiencyScore * 0.35) + (pendingScore * 0.25)

            return {
                id: ind.id,
                name: ind.name,
                email: ind.email,
                completedTasks,
                pendingTasks,
                totalTasks,
                actualMinutes,
                estimatedMinutes,
                efficiency: Math.round(efficiency),
                compositeScore: Math.round(compositeScore * 100) / 100,
            }
        })

        // Sort by composite score (descending) and assign ranks
        const sortedLeaderboard = leaderboardData
            .sort((a, b) => b.compositeScore - a.compositeScore)
            .map((entry, index) => ({
                ...entry,
                rank: index + 1,
            }))

        return NextResponse.json({
            leaderboard: sortedLeaderboard,
            lastUpdated: new Date().toISOString(),
        })
    } catch (error) {
        console.error("Error fetching leaderboard:", error)
        return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 })
    }
}
