import { NextResponse } from "next/server"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const task = searchParams.get("task") || "completed task"

    // Generate a motivational image URL using a placeholder service
    // In production, you would use OpenAI DALL-E or similar
    const imageUrl = `https://source.unsplash.com/800x400/?motivation,success,achievement`

    // For a real AI implementation with OpenAI:
    // if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "your-openai-api-key-here") {
    //   const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    //   const response = await openai.images.generate({
    //     model: "dall-e-3",
    //     prompt: `Create a motivational, colorful celebration image for completing the task: ${task}. Make it inspiring and positive.`,
    //     n: 1,
    //     size: "1024x1024",
    //   })
    //   return NextResponse.json({ imageUrl: response.data[0].url })
    // }

    return NextResponse.json({ imageUrl })
}
