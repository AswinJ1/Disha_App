import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
    try {
        const { name, email, password, role, counselorId } = await request.json()

        if (!name || !email || !password || !role) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            )
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return NextResponse.json(
                { error: "User already exists" },
                { status: 400 }
            )
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create user
        const userData: {
            name: string
            email: string
            password: string
            role: string
            counselorId?: string
        } = {
            name,
            email,
            password: hashedPassword,
            role,
        }

        // Only add counselorId if it's a valid non-empty string
        if (role === "INDIVIDUAL" && counselorId && counselorId.trim() !== "") {
            userData.counselorId = counselorId
        }

        const user = await prisma.user.create({
            data: userData
        })

        return NextResponse.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        })
    } catch (error) {
        console.error("Registration error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
