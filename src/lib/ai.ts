// Famous motivational quotes for reminder notifications
export const motivationalQuotes = [
    { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { quote: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
    { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { quote: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
    { quote: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
    { quote: "Your limitation—it's only your imagination.", author: "Unknown" },
    { quote: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
    { quote: "Great things never come from comfort zones.", author: "Unknown" },
    { quote: "Dream it. Wish it. Do it.", author: "Unknown" },
    { quote: "Success doesn't just find you. You have to go out and get it.", author: "Unknown" },
    { quote: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
    { quote: "Don't stop when you're tired. Stop when you're done.", author: "Unknown" },
    { quote: "Wake up with determination. Go to bed with satisfaction.", author: "Unknown" },
    { quote: "Little things make big days.", author: "Unknown" },
    { quote: "It's going to be hard, but hard does not mean impossible.", author: "Unknown" },
    { quote: "Don't wait for opportunity. Create it.", author: "Unknown" },
    { quote: "Sometimes we're tested not to show our weaknesses, but to discover our strengths.", author: "Unknown" },
]

export function getRandomQuote() {
    return motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
}

export function getMotivationalMessage(taskTitle: string): string {
    const messages = [
        `🎉 Amazing! You completed "${taskTitle}"! Keep up the fantastic work!`,
        `⭐ Brilliant! "${taskTitle}" is done! You're making incredible progress!`,
        `🚀 Awesome! "${taskTitle}" checked off! You're on fire today!`,
        `💪 Great job completing "${taskTitle}"! Every task brings you closer to your goals!`,
        `🌟 Wonderful! "${taskTitle}" complete! You should be proud of yourself!`,
        `🏆 Champion! You finished "${taskTitle}"! Keep this momentum going!`,
        `✨ Excellent! "${taskTitle}" is done! You're building great habits!`,
        `🎯 Perfect! "${taskTitle}" completed! Stay focused and keep winning!`,
        `💫 Spectacular! You knocked out "${taskTitle}"! Nothing can stop you!`,
        `🔥 Incredible! "${taskTitle}" finished! Your dedication is inspiring!`,
    ]
    return messages[Math.floor(Math.random() * messages.length)]
}

export async function generateAIMotivation(taskTitle: string): Promise<string> {
    // If OpenAI API key is available, use it
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "your-openai-api-key-here") {
        try {
            const { OpenAI } = await import("openai")
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are a supportive and encouraging wellness coach. Generate a short, enthusiastic motivational message (max 2 sentences) celebrating task completion. Include relevant emojis.",
                    },
                    {
                        role: "user",
                        content: `The user just completed this task: "${taskTitle}". Generate an encouraging message.`,
                    },
                ],
                max_tokens: 100,
            })

            return response.choices[0]?.message?.content || getMotivationalMessage(taskTitle)
        } catch (error) {
            console.error("OpenAI API error:", error)
            return getMotivationalMessage(taskTitle)
        }
    }

    return getMotivationalMessage(taskTitle)
}
