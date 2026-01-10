import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { format, subDays, startOfWeek, endOfWeek } from "date-fns"

// Simple in-memory cache to reduce API calls
const responseCache = new Map()
const CACHE_TTL = 60000 // 1 minute cache

// Rate limiting tracker - Gemini 2.0 Flash allows 15 RPM (1 request every 4 seconds to be safe)
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 500 // 500ms is enough for 15 RPM limit

interface TaskData {
  id: string
  title: string
  description: string | null
  status: string
  date: Date
  completed: boolean
  completedAt: Date | null
  estimatedMinutes: number | null
  actualMinutes: number | null
}

async function getUserTaskContext(userId: string): Promise<string> {
  const today = new Date()
  const weekStart = startOfWeek(today)
  const weekEnd = endOfWeek(today)
  const last7Days = subDays(today, 7)
  const last30Days = subDays(today, 30)

  // Fetch user's tasks
  const allTasks = await prisma.task.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 100,
  })

  const todayTasks = allTasks.filter(t =>
    format(new Date(t.date), "yyyy-MM-dd") === format(today, "yyyy-MM-dd")
  )

  const weekTasks = allTasks.filter(t => {
    const taskDate = new Date(t.date)
    return taskDate >= weekStart && taskDate <= weekEnd
  })

  const last7DaysTasks = allTasks.filter(t => new Date(t.date) >= last7Days)
  const last30DaysTasks = allTasks.filter(t => new Date(t.date) >= last30Days)

  // Calculate statistics
  const completedToday = todayTasks.filter(t => t.status === "DONE").length
  const pendingToday = todayTasks.filter(t => t.status !== "DONE").length
  const inProgressToday = todayTasks.filter(t => t.status === "IN_PROGRESS").length

  const completedThisWeek = weekTasks.filter(t => t.status === "DONE").length
  const totalThisWeek = weekTasks.length

  const completedLast7Days = last7DaysTasks.filter(t => t.status === "DONE").length
  const totalLast7Days = last7DaysTasks.length
  const completionRate7Days = totalLast7Days > 0
    ? Math.round((completedLast7Days / totalLast7Days) * 100)
    : 0

  const completedLast30Days = last30DaysTasks.filter(t => t.status === "DONE").length
  const totalLast30Days = last30DaysTasks.length
  const completionRate30Days = totalLast30Days > 0
    ? Math.round((completedLast30Days / totalLast30Days) * 100)
    : 0

  // Calculate streak
  let currentStreak = 0
  const completedDates = new Set()
  allTasks
    .filter(t => t.status === "DONE" && t.completedAt)
    .forEach(t => completedDates.add(format(new Date(t.completedAt!), "yyyy-MM-dd")))

  const checkDate = new Date(today)
  while (completedDates.has(format(checkDate, "yyyy-MM-dd"))) {
    currentStreak++
    checkDate.setDate(checkDate.getDate() - 1)
  }

  // Get recent incomplete tasks
  const recentIncompleteTasks = allTasks
    .filter(t => t.status !== "DONE" && new Date(t.date) < today)
    .slice(0, 5)
    .map(t => `- "${t.title}" (Due: ${format(new Date(t.date), "MMM d")})`)
    .join("\n")

  // Get today's task list
  const todayTaskList = todayTasks
    .map(t => `- "${t.title}" [${t.status}]${t.estimatedMinutes ? ` (Est: ${t.estimatedMinutes}min)` : ""}`)
    .join("\n") || "No tasks scheduled for today"

  return `
USER'S CURRENT DATA (Use ONLY this data for analysis):

TODAY (${format(today, "EEEE, MMMM d, yyyy")}):
- Tasks Today: ${todayTasks.length}
- Completed: ${completedToday}
- In Progress: ${inProgressToday}
- Pending: ${pendingToday}
- Today's Tasks:
${todayTaskList}

THIS WEEK:
- Total Tasks: ${totalThisWeek}
- Completed: ${completedThisWeek}
- Completion Rate: ${totalThisWeek > 0 ? Math.round((completedThisWeek / totalThisWeek) * 100) : 0}%

LAST 7 DAYS:
- Total Tasks: ${totalLast7Days}
- Completed: ${completedLast7Days}
- Completion Rate: ${completionRate7Days}%

LAST 30 DAYS:
- Total Tasks: ${totalLast30Days}
- Completed: ${completedLast30Days}
- Completion Rate: ${completionRate30Days}%

STREAK:
- Current Streak: ${currentStreak} days

OVERDUE/INCOMPLETE TASKS:
${recentIncompleteTasks || "No overdue tasks - Great job!"}
`
}

async function getCounselorIndividualsContext(counselorId: string): Promise<string> {
  const today = new Date()
  const last7Days = subDays(today, 7)
  const last30Days = subDays(today, 30)

  // Fetch all individuals assigned to this counselor
  const individuals = await prisma.user.findMany({
    where: { counselorId },
    include: {
      tasks: {
        orderBy: { date: "desc" },
        take: 50,
      },
    },
  })

  if (individuals.length === 0) {
    return `
COUNSELOR DATA:
You currently have no individuals assigned to you. 
To start tracking progress, add individuals from your dashboard.
`
  }

  let individualsData = ""
  let totalTasks = 0
  let totalCompleted = 0
  let individualsNeedingAttention: string[] = []

  for (const individual of individuals) {
    const tasks = individual.tasks
    const completed = tasks.filter(t => t.status === "DONE").length
    const pending = tasks.filter(t => t.status !== "DONE").length
    const todayTasks = tasks.filter(t => 
      format(new Date(t.date), "yyyy-MM-dd") === format(today, "yyyy-MM-dd")
    )
    const last7DaysTasks = tasks.filter(t => new Date(t.date) >= last7Days)
    const completedLast7 = last7DaysTasks.filter(t => t.status === "DONE").length
    const completionRate = last7DaysTasks.length > 0 
      ? Math.round((completedLast7 / last7DaysTasks.length) * 100) 
      : 0

    // Calculate streak for individual
    let streak = 0
    const completedDates = new Set()
    tasks
      .filter(t => t.status === "DONE" && t.completedAt)
      .forEach(t => completedDates.add(format(new Date(t.completedAt!), "yyyy-MM-dd")))
    
    const checkDate = new Date(today)
    while (completedDates.has(format(checkDate, "yyyy-MM-dd"))) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    }

    // Check if individual needs attention (low completion rate or no recent activity)
    if (completionRate < 50 && last7DaysTasks.length > 0) {
      individualsNeedingAttention.push(`${individual.name} (${completionRate}% completion rate)`)
    }

    const overdueTasks = tasks
      .filter(t => t.status !== "DONE" && new Date(t.date) < today)
      .slice(0, 3)
      .map(t => `    - "${t.title}" (Due: ${format(new Date(t.date), "MMM d")})`)
      .join("\n")

    const recentCompletedTasks = tasks
      .filter(t => t.status === "DONE" && new Date(t.date) >= last7Days)
      .slice(0, 3)
      .map(t => `    - "${t.title}"`)
      .join("\n")

    individualsData += `
📊 ${individual.name} (${individual.email}):
   - Total Tasks: ${tasks.length}
   - Completed: ${completed} | Pending: ${pending}
   - Today's Tasks: ${todayTasks.length} (${todayTasks.filter(t => t.status === "DONE").length} done)
   - Last 7 Days Completion: ${completionRate}%
   - Current Streak: ${streak} days
   ${overdueTasks ? `- Overdue Tasks:\n${overdueTasks}` : "   - No overdue tasks ✓"}
   ${recentCompletedTasks ? `- Recently Completed:\n${recentCompletedTasks}` : ""}
`
    totalTasks += tasks.length
    totalCompleted += completed
  }

  const overallCompletionRate = totalTasks > 0 
    ? Math.round((totalCompleted / totalTasks) * 100) 
    : 0

  return `
COUNSELOR DASHBOARD DATA (Use ONLY this data for analysis):

OVERVIEW:
- Total Individuals: ${individuals.length}
- Total Tasks Across All Individuals: ${totalTasks}
- Total Completed: ${totalCompleted}
- Overall Completion Rate: ${overallCompletionRate}%

${individualsNeedingAttention.length > 0 ? `⚠️ INDIVIDUALS NEEDING ATTENTION:
${individualsNeedingAttention.map(i => `- ${i}`).join("\n")}
` : "✅ All individuals are performing well!"}

INDIVIDUAL DETAILS:
${individualsData}
`
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message, context, history } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Fetch appropriate data based on context
    let userTaskContext = ""
    if (context === "individual") {
      userTaskContext = await getUserTaskContext(session.user.id)
    } else if (context === "counselor") {
      userTaskContext = await getCounselorIndividualsContext(session.user.id)
    }

    // Build context-aware system prompt based on strict guidelines
    const systemPrompt = context === "counselor"
      ? `You are an AI Assistant designed EXCLUSIVELY for this counselor dashboard application. Your purpose is to help counselors track, analyze, and support their individuals' learning and task completion.

STRICT RULES:
1. DATA SCOPE & PRIVACY
   - You can ONLY use data provided by this application (shown below)
   - You must NOT use external knowledge, personal assumptions, or information outside this app
   - If a question is unrelated to this app or its data, politely refuse to answer

2. COUNSELOR-SPECIFIC ANALYSIS
   - Analyze individuals' tasks, schedules, learning goals, and progress stored in this app
   - Track completed and incomplete tasks by date
   - Identify learning patterns, strengths, weak areas, and consistency over time
   - Provide insights on individual progress and suggest interventions

3. FEEDBACK & GUIDANCE
   - Suggest effective motivational messages for individuals
   - Provide counseling strategies based on data patterns
   - Help identify individuals who may need extra support

4. RESTRICTIONS
   - Do NOT answer questions unrelated to: Tasks, Learning, Exams, Productivity, Progress tracking, Counseling
   - Do NOT provide medical, legal, financial, or personal advice
   - Do NOT generate content outside the context of this app

5. RESPONSE STYLE
   - Be clear, professional, and concise
   - Use simple language
   - Focus on actionable insights
   - Maintain a supportive and professional tone

${userTaskContext}`
      : `You are an AI Assistant designed EXCLUSIVELY for this learning and task management application. Your purpose is to help the individual plan, track, analyze, and improve their learning and task completion over time.

STRICT RULES YOU MUST FOLLOW:

1. DATA SCOPE & PRIVACY
   - You can ONLY use data provided by this application (shown below)
   - You must NOT use external knowledge, personal assumptions, or information outside this app
   - If a question is unrelated to this app or its data, politely refuse to answer

2. USER-SPECIFIC LEARNING & TASK ANALYSIS
   - Analyze the individual's tasks, schedules, learning goals, and progress stored in this app
   - Track completed and incomplete tasks by date
   - Identify learning patterns, strengths, weak areas, and consistency over time
   - Provide insights such as:
     • What the user learned during a specific time period
     • Missed tasks and possible reasons (based only on available data)
     • Progress toward learning goals

3. FEEDBACK & MOTIVATION
   - If tasks are incomplete, give constructive feedback and practical suggestions
   - If tasks are completed successfully, acknowledge progress and motivate the user
   - Suggest improvements, study strategies, or better time management based on the user's data
   - Encourage consistency, discipline, and confidence without negative or judgmental language

4. RESTRICTIONS
   - Do NOT answer questions unrelated to: Tasks, Learning, Exams, Productivity, Progress tracking
   - Do NOT provide medical, legal, financial, or personal advice
   - Do NOT generate content outside the context of this app
   - If asked about unrelated topics, respond with: "I'm here to help you with your tasks, learning, and productivity. Is there something related to your progress I can assist with?"

5. RESPONSE STYLE
   - Be clear, supportive, and concise
   - Use simple language
   - Focus on actionable insights
   - Maintain a motivating and professional tone at all times

Your responses should help the user understand:
- What they have achieved
- What they missed
- What they can improve
- How to move forward effectively

${userTaskContext}`

    // Format conversation history
    const conversationHistory = history?.slice(-10).map((msg: { role: string; content: string }) => ({
      role: msg.role,
      content: msg.content,
    })) || []

    // Call your AI service (OpenAI, Anthropic, etc.)
    const response = await generateAIResponse(message, systemPrompt, conversationHistory, context, userTaskContext)

    return NextResponse.json({ response })
  } catch (error) {
    console.error("AI chat error:", error)
    return NextResponse.json(
      { error: "Failed to process AI request" },
      { status: 500 }
    )
  }
}

async function generateAIResponse(
  message: string,
  systemPrompt: string,
  history: Array<{ role: string; content: string }>,
  context: string,
  userTaskContext: string
): Promise<string> {
  const geminiApiKey = process.env.GEMINI_KEY

  if (!geminiApiKey) {
    console.error("❌ GEMINI_KEY not found in environment variables!")
    return generateLocalResponse(message, context, userTaskContext)
  }

  console.log(`🔑 API Key loaded: ${geminiApiKey.substring(0, 10)}...`)

  // Check cache first
  const cacheKey = `${context}:${message.toLowerCase().trim()}`
  const cached = responseCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log("💾 Returning cached response")
    return cached.response
  }

  // Rate limiting - ensure minimum interval between requests
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest))
  }
  lastRequestTime = Date.now()

  // Retry logic for rate limiting with exponential backoff
  const maxRetries = 3
  let retryDelay = 1000 // Start with 1 second

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🤖 Attempt ${attempt}/${maxRetries} - Calling Gemini API...`)
      
      // Format conversation history for Gemini (limit to last 4 messages to reduce tokens)
      const formattedHistory = history.slice(-4).map(msg => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }]
      }))

      // Shorter system prompt to reduce token usage
      const shortSystemPrompt = context === "individual"
        ? `You are a helpful learning assistant. Use ONLY the user's data below to provide insights about their tasks and progress. Be concise and motivating.\n\n${userTaskContext}`
        : `You are a counselor assistant. Help analyze individual progress and suggest interventions based on the data below. Be professional and concise.\n\n${userTaskContext}`

      // Using gemma-3-27b-it (instruction-tuned version - required for generateContent)
      // Note: Gemma uses same API as Gemini, just needs -it suffix
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": geminiApiKey,
          },
          body: JSON.stringify({
            contents: [
              { role: "user", parts: [{ text: shortSystemPrompt }] },
              { role: "model", parts: [{ text: "Understood. I'll help with tasks and productivity only." }] },
              ...formattedHistory,
              { role: "user", parts: [{ text: message }] }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 512, // Reduced for faster responses
            },
          }),
        }
      )

      // Handle rate limiting (429) with proper error messages
      if (response.status === 429) {
        const errorData = await response.json().catch(() => ({}))
        console.log(`⚠️ Rate limited (429). Attempt ${attempt}/${maxRetries}`)
        console.log(`Error details:`, errorData)
        
        if (attempt < maxRetries) {
          console.log(`Waiting ${retryDelay / 1000}s before retry...`)
          await new Promise(resolve => setTimeout(resolve, retryDelay))
          retryDelay *= 2 // Exponential backoff
          continue
        } else {
          console.log("⚠️ Rate limit exceeded after all retries. Using local fallback.")
          return generateLocalResponse(message, context, userTaskContext)
        }
      }

      // Log other HTTP errors
      if (!response.ok) {
        const errorData = await response.json()
        console.error(`❌ Gemini API error (${response.status}):`, errorData)
        
        // If it's not a rate limit, fail immediately
        if (response.status !== 429) {
          return generateLocalResponse(message, context, userTaskContext)
        }
      }

      const data = await response.json()
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (!responseText) {
        console.error("❌ No response text from Gemini:", data)
        return generateLocalResponse(message, context, userTaskContext)
      }

      console.log("✅ Successfully received response from Gemini API")

      // Cache the response
      responseCache.set(cacheKey, {
        response: responseText,
        timestamp: Date.now()
      })

      return responseText
    } catch (error) {
      console.error(`❌ Gemini API error (attempt ${attempt}):`, error)
      if (attempt === maxRetries) {
        console.log("⚠️ All retries exhausted. Using local fallback.")
        return generateLocalResponse(message, context, userTaskContext)
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay))
      retryDelay *= 2
    }
  }

  console.log("⚠️ Fell through retry loop. Using local fallback.")
  return generateLocalResponse(message, context, userTaskContext)
}

function generateLocalResponse(message: string, context: string, userTaskContext: string): string {
  const lowerMessage = message.toLowerCase()

  // Parse user task context for personalized responses
  const streakMatch = userTaskContext.match(/Current Streak: (\d+) days/)
  const currentStreak = streakMatch ? parseInt(streakMatch[1]) : 0

  const completionRateMatch = userTaskContext.match(/LAST 7 DAYS:[\s\S]*?Completion Rate: (\d+)%/)
  const completionRate = completionRateMatch ? parseInt(completionRateMatch[1]) : 0

  const hasOverdueTasks = userTaskContext.includes("Due:") && !userTaskContext.includes("No overdue tasks")

  const todayTasksMatch = userTaskContext.match(/Tasks Today: (\d+)/)
  const todayTasks = todayTasksMatch ? parseInt(todayTasksMatch[1]) : 0

  const completedTodayMatch = userTaskContext.match(/TODAY[\s\S]*?Completed: (\d+)/)
  const completedToday = completedTodayMatch ? parseInt(completedTodayMatch[1]) : 0

  // Greetings - be friendly!
  if (lowerMessage.match(/^(hi|hello|hey|sup|yo|good morning|good evening)/)) {
    return `Hello! 👋 I'm your learning assistant.\n\n🔥 Current streak: **${currentStreak} days**\n📊 7-day completion rate: **${completionRate}%**\n📋 Tasks today: **${todayTasks}** (${completedToday} completed)\n\nHow can I help you today? Ask me about your progress, tasks, or just chat about productivity!`
  }

  if (context === "counselor") {
    return "I can help you analyze your individuals' progress. You can ask about their completion rates, who needs attention, or strategies for motivation. What would you like to know?"
  }

  // Motivation and encouragement
  if (lowerMessage.includes("motivation") || lowerMessage.includes("motivate") || lowerMessage.includes("stuck") || lowerMessage.includes("help") || lowerMessage.includes("complete work") || lowerMessage.includes("need to work")) {
    const motivationalMessages = [
      `💪 **You've Got This!**\n\n${currentStreak > 0 ? `You've already built a ${currentStreak}-day streak - that shows real dedication!\n\n` : ""}Here's how to get started:\n\n1. **Break it down** - Start with just 5 minutes on one task\n2. **Remove distractions** - Close unnecessary tabs, silence your phone\n3. **Reward yourself** - Take a break after completing each task\n4. **Remember your why** - Why did you set this goal?\n\n${completionRate < 50 ? "You're building momentum. Every completed task is progress! 🚀" : "You're already doing great - keep that energy going! 🌟"}`,
      
      `🌟 **Time to Shine!**\n\n${todayTasks > 0 ? `You have ${todayTasks} tasks waiting for you. Let's tackle them!\n\n` : ""}**Quick Motivation Boost:**\n\n✨ "The secret of getting ahead is getting started" - Mark Twain\n💡 Start with the easiest task to build momentum\n🎯 Focus on progress, not perfection\n⚡ Action creates motivation, not the other way around\n\nPick ONE task right now and give it 10 minutes. You'll be amazed how far you get! 🚀`,
      
      `🔥 **Let's Get Moving!**\n\n${hasOverdueTasks ? "I see you have some overdue tasks. That's okay - today is a fresh start!\n\n" : ""}**Your Action Plan:**\n\n1. **Set a timer for 25 minutes** (Pomodoro technique)\n2. **Work on ONE task** - no multitasking\n3. **Take a 5-minute break** when the timer rings\n4. **Repeat** - you'll be surprised how much you accomplish!\n\n${completionRate >= 50 ? "You've been completing tasks well - you know you can do this! 💪" : "Small steps lead to big results. Start now! 🌱"}`
    ]
    
    return motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
  }

  // Progress and status
  if (lowerMessage.includes("progress") || lowerMessage.includes("how am i") || lowerMessage.includes("status") || lowerMessage.includes("doing")) {
    let response = "📊 **Your Progress Summary**\n\n"
    response += `🔥 Current Streak: **${currentStreak} days**\n`
    response += `📈 7-Day Completion Rate: **${completionRate}%**\n`
    response += `📋 Today: **${completedToday}/${todayTasks}** tasks completed\n\n`

    if (completionRate >= 80) {
      response += "🎉 **Outstanding!** You're crushing it with excellent consistency!"
    } else if (completionRate >= 60) {
      response += "💪 **Great work!** You're maintaining solid progress. Keep it up!"
    } else if (completionRate >= 40) {
      response += "📈 **Good start!** You're building momentum. Stay focused!"
    } else if (completionRate > 0) {
      response += "🌱 **Every journey starts somewhere!** Focus on one task at a time and you'll see improvement."
    } else {
      response += "🚀 **Ready to start?** Today is the perfect day to begin building your streak!"
    }

    if (hasOverdueTasks) {
      response += "\n\n⚠️ You have some overdue tasks. Want tips on catching up?"
    }

    return response
  }

  // Today's tasks
  if (lowerMessage.includes("today") || lowerMessage.includes("task")) {
    const todaySection = userTaskContext.match(/Today's Tasks:\n([\s\S]*?)(?=\n\nTHIS WEEK|$)/)
    const tasksList = todaySection ? todaySection[1].trim() : "No tasks scheduled for today"
    return `📋 **Today's Tasks**\n\n${tasksList}\n\n💡 **Pro Tip**: Start with your most important or challenging task first - eat that frog! 🐸`
  }

  // Streak information
  if (lowerMessage.includes("streak")) {
    if (currentStreak > 0) {
      let encouragement = ""
      if (currentStreak >= 30) encouragement = "🏆 **LEGENDARY!** A whole month of consistency!"
      else if (currentStreak >= 14) encouragement = "🌟 **Two weeks strong!** You're building incredible habits!"
      else if (currentStreak >= 7) encouragement = "🎯 **One week milestone!** Amazing dedication!"
      else if (currentStreak >= 3) encouragement = "💪 **Building momentum!** Keep it going!"
      else encouragement = "🌱 **Great start!** Every day counts!"
      
      return `🔥 **You're on a ${currentStreak}-day streak!**\n\n${encouragement}\n\nComplete at least one task today to keep your streak alive! Your consistency is inspiring! ✨`
    }
    return "📅 **Start Your Streak Today!**\n\nComplete at least one task to begin your journey. Consistency is the key to success - even small daily actions lead to big results over time! 🚀"
  }

  // Productivity tips and strategies
  if (lowerMessage.includes("80/20") || lowerMessage.includes("pareto") || lowerMessage.includes("80 20")) {
    return `📊 **The 80/20 Rule (Pareto Principle)**\n\n💡 **Key Idea**: 80% of your results come from 20% of your efforts.\n\n**How to Apply:**\n\n1. **Identify your 20%** - Which tasks have the biggest impact?\n2. **Prioritize ruthlessly** - Focus on high-impact activities first\n3. **Eliminate or delegate** - The low-value 80% can often wait\n\n**Example**: If you have 10 tasks, 2-3 of them probably matter most. Do those first!\n\n${todayTasks > 0 ? `\nLook at your ${todayTasks} tasks today - which ones will move the needle most? Start there! 🎯` : "\nApply this to your next task list! 🚀"}`
  }

  // Time management techniques
  if (lowerMessage.includes("pomodoro") || lowerMessage.includes("time management") || lowerMessage.includes("focus")) {
    return `⏰ **Time Management Techniques**\n\n🍅 **Pomodoro Technique:**\n• Work for 25 minutes (focused)\n• Take 5-minute break\n• Repeat 4 times\n• Take longer 15-30 minute break\n\n⚡ **Time Blocking:**\n• Schedule specific times for specific tasks\n• Treat appointments with yourself seriously\n• Batch similar tasks together\n\n🎯 **Eat The Frog:**\n• Do your hardest/most important task first\n• Everything else feels easier after!\n\n${todayTasks > 0 ? `Try the Pomodoro technique on your next task! 🚀` : "Ready to boost your productivity? 💪"}`
  }

  // Study tips
  if (lowerMessage.includes("study") || lowerMessage.includes("learn") || lowerMessage.includes("exam") || lowerMessage.includes("focus")) {
    return `📚 **Effective Learning Strategies**\n\n**Before Studying:**\n• 🎯 Set a clear goal (e.g., "Understand Chapter 5")\n• 📱 Remove distractions\n• ☕ Have water/snacks ready\n\n**While Studying:**\n• 🧠 Active recall - test yourself frequently\n• 📝 Take notes in your own words\n• 🔄 Take breaks every 25-50 minutes\n• 🎨 Use diagrams, mind maps, flashcards\n\n**After Studying:**\n• 💭 Explain concepts to yourself or others\n• 📊 Review and revise regularly\n• 😴 Sleep well - your brain consolidates learning during sleep\n\n${currentStreak > 0 ? `Your ${currentStreak}-day streak shows you can be consistent - apply that to studying! 🌟` : "Consistency beats intensity. Study a little every day! 📈"}`
  }

  // Handle other questions with a helpful tone
  if (lowerMessage.includes("?") || lowerMessage.includes("what") || lowerMessage.includes("how") || lowerMessage.includes("why") || lowerMessage.includes("who")) {
    return `I'm here primarily to help you with tasks, learning, and productivity! 📚\n\nWhile I can't answer general knowledge questions (like current events or trivia), I can definitely help you with:\n\n✅ **Task management** - "What's on for today?"\n✅ **Progress tracking** - "How am I doing?"\n✅ **Motivation** - "I need motivation"\n✅ **Study strategies** - "How to focus better?"\n✅ **Time management** - "Tell me about the Pomodoro technique"\n✅ **Goal setting** - "How to stay consistent?"\n\n${todayTasks > 0 ? `\nYou have ${todayTasks} tasks today - want to discuss them? 🎯` : "\nWhat would you like help with? 💪"}`
  }

  // Default helpful response
  return `Hi! I'm your learning assistant. 👋\n\n📊 **Quick Stats:**\n🔥 Streak: **${currentStreak} days**\n📈 7-day completion: **${completionRate}%**\n📋 Today: **${completedToday}/${todayTasks}** tasks done\n\n**I can help you with:**\n• 📊 Progress tracking\n• 📋 Task management  \n• 💪 Motivation and encouragement\n• 📚 Study and productivity tips\n• 🎯 Goal setting strategies\n• ⏰ Time management techniques\n\nWhat would you like to know? 🚀`
}