import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
    try {
        const counselors = await prisma.user.findMany({
            where: { role: "COUNSELOR" },
            select: {
                id: true,
                name: true,
                email: true,
            },
        })

        return NextResponse.json(counselors)
    } catch (error) {
        console.error("Error fetching counselors:", error)
        return NextResponse.json(
            { error: "Failed to fetch counselors" },
            { status: 500 }
        )
    }
}
