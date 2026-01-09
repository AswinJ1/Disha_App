import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
    console.log("🌱 Starting database seed...")

    // Create a counselor
    const counselorPassword = await bcrypt.hash("counselor123", 10)
    const counselor = await prisma.user.upsert({
        where: { email: "counselor@example.com" },
        update: {},
        create: {
            name: "Dr. Sarah Johnson",
            email: "counselor@example.com",
            password: counselorPassword,
            role: "COUNSELOR",
        },
    })
    console.log("✅ Created counselor:", counselor.email)

    // Create an individual
    const individualPassword = await bcrypt.hash("individual123", 10)
    const individual = await prisma.user.upsert({
        where: { email: "john@example.com" },
        update: {},
        create: {
            name: "John Doe",
            email: "john@example.com",
            password: individualPassword,
            role: "INDIVIDUAL",
            counselorId: counselor.id,
        },
    })
    console.log("✅ Created individual:", individual.email)

    // Create some sample tasks for the individual
    const today = new Date()
    const tasks = [
        { title: "Morning meditation", description: "15 minutes of mindfulness", daysAgo: 0, completed: false },
        { title: "Exercise routine", description: "30 minutes workout", daysAgo: 0, completed: true },
        { title: "Read a book", description: "Read for 20 minutes", daysAgo: 1, completed: true },
        { title: "Take vitamins", description: "Daily supplements", daysAgo: 1, completed: true },
        { title: "Journal writing", description: "Write about your day", daysAgo: 2, completed: true },
        { title: "Go for a walk", description: "30 minutes outdoor walk", daysAgo: 2, completed: false },
        { title: "Healthy breakfast", description: "Eat a nutritious breakfast", daysAgo: 3, completed: true },
        { title: "Practice gratitude", description: "Write 3 things you're grateful for", daysAgo: 3, completed: true },
    ]

    for (const task of tasks) {
        const taskDate = new Date(today)
        taskDate.setDate(taskDate.getDate() - task.daysAgo)

        await prisma.task.create({
            data: {
                title: task.title,
                description: task.description,
                date: taskDate,
                completed: task.completed,
                completedAt: task.completed ? taskDate : null,
                aiReward: task.completed ? "🎉 Great job completing this task!" : null,
                userId: individual.id,
            },
        })
    }
    console.log("✅ Created sample tasks")

    // Create some motivational quotes
    const quotes = [
        { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
        { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
        { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
        { quote: "Success is not final, failure is not fatal.", author: "Winston Churchill" },
        { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
    ]

    for (const q of quotes) {
        await prisma.motivationalQuote.create({
            data: q,
        })
    }
    console.log("✅ Created motivational quotes")

    // Create a sample feedback
    await prisma.feedback.create({
        data: {
            message: "Great progress this week! Keep up the excellent work on your daily routines. I'm impressed with your consistency!",
            counselorId: counselor.id,
            individualId: individual.id,
        },
    })
    console.log("✅ Created sample feedback")

    // Create a sample notification
    await prisma.notification.create({
        data: {
            message: "Welcome to Counselor App! Start tracking your daily activities today.",
            type: "MOTIVATION",
            userId: individual.id,
        },
    })
    console.log("✅ Created sample notification")

    console.log("🎉 Database seeding completed!")
    console.log("\n📌 Test accounts:")
    console.log("   Counselor: counselor@example.com / counselor123")
    console.log("   Individual: john@example.com / individual123")
}

main()
    .catch((e) => {
        console.error("❌ Seeding error:", e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
