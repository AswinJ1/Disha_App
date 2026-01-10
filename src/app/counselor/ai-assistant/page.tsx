"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    TextField,
    IconButton,
    Avatar,
    AppBar,
    Toolbar,
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    useMediaQuery,
    useTheme as useMuiTheme,
    CircularProgress,
    Button,
} from "@mui/material"
import {
    Dashboard,
    People,
    Analytics,
    Logout,
    Menu,
    Home,
    DarkMode,
    LightMode,
    SmartToy,
    Send,
    Person,
    Add,
    Delete,
    History,
} from "@mui/icons-material"
import Link from "next/link"
import { useThemeMode } from "@/theme/ThemeContext"
import { signOut } from "next-auth/react"
import { isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns"

interface Message {
    id?: string
    role: "user" | "assistant"
    content: string
}

interface ChatSession {
    id: string
    title: string
    createdAt: string
    updatedAt: string
    messages: Message[]
}

const drawerWidth = 300

export default function CounselorAIAssistant() {
    const muiTheme = useMuiTheme()
    const { mode, toggleTheme } = useThemeMode()
    const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"))
    const { data: session } = useSession()
    const [drawerOpen, setDrawerOpen] = useState(!isMobile)
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "Hello! I'm your AI assistant. I can help you with managing individuals, tracking progress, providing counseling tips, and generating insights. How can I assist you today?"
        }
    ])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [sessionsLoading, setSessionsLoading] = useState(true)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const fetchChatSessions = useCallback(async () => {
        try {
            const res = await fetch("/api/chat-history")
            if (res.ok) {
                const data = await res.json()
                setChatSessions(data)
            }
        } catch (error) {
            console.error("Failed to fetch chat sessions:", error)
        } finally {
            setSessionsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchChatSessions()
    }, [fetchChatSessions])

    useEffect(() => {
        setDrawerOpen(!isMobile)
    }, [isMobile])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    const loadSession = (sessionId: string) => {
        const chatSession = chatSessions.find(s => s.id === sessionId)
        if (chatSession) {
            setCurrentSessionId(chatSession.id)
            setMessages(chatSession.messages)
        }
    }

    const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        try {
            const res = await fetch(`/api/chat-history/${sessionId}`, {
                method: "DELETE",
            })
            if (res.ok) {
                setChatSessions(prev => prev.filter(s => s.id !== sessionId))
                if (currentSessionId === sessionId) {
                    setCurrentSessionId(null)
                    setMessages([{
                        role: "assistant",
                        content: "Hello! I'm your AI assistant. I can help you with managing individuals, tracking progress, providing counseling tips, and generating insights. How can I assist you today?"
                    }])
                }
            }
        } catch (error) {
            console.error("Failed to delete chat session:", error)
        }
    }

    const startNewChat = () => {
        setCurrentSessionId(null)
        setMessages([{
            role: "assistant",
            content: "Hello! I'm your AI assistant. I can help you with managing individuals, tracking progress, providing counseling tips, and generating insights. How can I assist you today?"
        }])
    }

    const handleSend = async () => {
        if (!input.trim() || loading) return

        const userMessage = input.trim()
        setInput("")
        setMessages(prev => [...prev, { role: "user", content: userMessage }])
        setLoading(true)

        // Create session if needed
        let sessionId = currentSessionId
        if (!sessionId) {
            try {
                const res = await fetch("/api/chat-history", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title: userMessage.substring(0, 50) }),
                })
                if (res.ok) {
                    const newSession = await res.json()
                    sessionId = newSession.id
                    setCurrentSessionId(newSession.id)
                    setChatSessions(prev => [newSession, ...prev])
                }
            } catch (error) {
                console.error("Failed to create session:", error)
            }
        }

        // Save user message to session
        if (sessionId) {
            try {
                await fetch(`/api/chat-history/${sessionId}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ role: "user", content: userMessage }),
                })
            } catch (error) {
                console.error("Failed to save user message:", error)
            }
        }

        try {
            const response = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    message: userMessage,
                    context: "counselor",
                    history: messages 
                }),
            })

            if (response.ok) {
                const data = await response.json()
                setMessages(prev => [...prev, { role: "assistant", content: data.response }])
                
                // Save assistant response to session
                if (sessionId) {
                    try {
                        await fetch(`/api/chat-history/${sessionId}`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ role: "assistant", content: data.response }),
                        })
                        fetchChatSessions()
                    } catch (error) {
                        console.error("Failed to save assistant message:", error)
                    }
                }
            } else {
                setMessages(prev => [...prev, { 
                    role: "assistant", 
                    content: "I apologize, but I encountered an issue processing your request. Please try again." 
                }])
            }
        } catch (error) {
            console.error("AI chat error:", error)
            setMessages(prev => [...prev, { 
                role: "assistant", 
                content: "I'm currently having trouble connecting. Please check your connection and try again." 
            }])
        } finally {
            setLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    // Group sessions by date
    const groupedSessions = chatSessions.reduce((groups, chatSession) => {
        const date = new Date(chatSession.updatedAt)
        let key = "Older"
        
        if (isToday(date)) {
            key = "Today"
        } else if (isYesterday(date)) {
            key = "Yesterday"
        } else if (isThisWeek(date)) {
            key = "This Week"
        } else if (isThisMonth(date)) {
            key = "This Month"
        }
        
        if (!groups[key]) {
            groups[key] = []
        }
        groups[key].push(chatSession)
        return groups
    }, {} as Record<string, ChatSession[]>)

    const dateOrder = ["Today", "Yesterday", "This Week", "This Month", "Older"]

    const sidebarContent = (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar sx={{ bgcolor: "secondary.main", width: 32, height: 32, fontSize: "0.875rem" }}>
                        {session?.user?.name?.[0]?.toUpperCase() || "C"}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                            {session?.user?.name || "Counselor"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Counselor
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={toggleTheme}>
                        {mode === "light" ? <DarkMode /> : <LightMode />}
                    </IconButton>
                </Box>
            </Box>

            <Box sx={{ p: 1 }}>
                <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={startNewChat}
                    sx={{ mb: 1 }}
                >
                    New Chat
                </Button>
            </Box>

            <Divider />

            <Box sx={{ p: 1 }}>
                <List dense>
                    <ListItemButton component={Link} href="/counselor">
                        <ListItemIcon><Home /></ListItemIcon>
                        <ListItemText primary="Dashboard" />
                    </ListItemButton>
                </List>
            </Box>

            <Divider />

            <Box sx={{ flex: 1, overflow: "auto", p: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ px: 1, fontWeight: 600, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 0.5 }}>
                    <History fontSize="small" /> Chat History
                </Typography>
                
                {sessionsLoading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                        <CircularProgress size={20} />
                    </Box>
                ) : chatSessions.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: "center" }}>
                        No chat history yet. Start a conversation!
                    </Typography>
                ) : (
                    <List dense>
                        {dateOrder.map(dateKey => {
                            const sessions = groupedSessions[dateKey]
                            if (!sessions || sessions.length === 0) return null
                            
                            return (
                                <Box key={dateKey}>
                                    <Typography 
                                        variant="caption" 
                                        color="text.secondary" 
                                        sx={{ px: 1, py: 0.5, display: "block", fontWeight: 500 }}
                                    >
                                        {dateKey}
                                    </Typography>
                                    {sessions.map((chatSession) => (
                                        <ListItemButton
                                            key={chatSession.id}
                                            selected={currentSessionId === chatSession.id}
                                            onClick={() => loadSession(chatSession.id)}
                                            sx={{ 
                                                borderRadius: 1,
                                                py: 0.5,
                                                "&:hover .delete-btn": { opacity: 1 },
                                            }}
                                        >
                                            <ListItemIcon sx={{ minWidth: 32 }}>
                                                <SmartToy fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText 
                                                primary={chatSession.title}
                                                primaryTypographyProps={{
                                                    noWrap: true,
                                                    fontSize: "0.875rem",
                                                }}
                                            />
                                            <IconButton
                                                size="small"
                                                className="delete-btn"
                                                onClick={(e) => deleteSession(chatSession.id, e)}
                                                sx={{ opacity: 0, transition: "opacity 0.2s" }}
                                            >
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </ListItemButton>
                                    ))}
                                </Box>
                            )
                        })}
                    </List>
                )}
            </Box>
        </Box>
    )

    return (
        <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    bgcolor: "background.paper",
                    color: "text.primary",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                }}
            >
                <Toolbar>
                    <IconButton color="inherit" onClick={() => setDrawerOpen(!drawerOpen)} sx={{ mr: 2 }}>
                        <Menu />
                    </IconButton>
                    <SmartToy sx={{ mr: 1, color: "primary.main" }} />
                    <Typography variant="h6" fontWeight={600} sx={{ flexGrow: 1 }}>
                        AI Assistant
                    </Typography>
                    <IconButton color="inherit" onClick={() => signOut({ callbackUrl: "/login" })}>
                        <Logout />
                    </IconButton>
                </Toolbar>
            </AppBar>

            <Drawer
                variant={isMobile ? "temporary" : "persistent"}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    "& .MuiDrawer-paper": {
                        width: drawerWidth,
                        boxSizing: "border-box",
                        bgcolor: "background.paper",
                        borderRight: "1px solid",
                        borderColor: "divider",
                    },
                }}
            >
                <Toolbar />
                {sidebarContent}
            </Drawer>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    height: "100vh",
                    width: { md: `calc(100% - ${drawerOpen ? drawerWidth : 0}px)` },
                    ml: { md: drawerOpen ? 0 : `-${drawerWidth}px` },
                    transition: "margin 0.3s, width 0.3s",
                }}
            >
                <Toolbar />
                
                {/* Messages Area */}
                <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
                    <Container maxWidth="md">
                        {messages.map((message, index) => (
                            <Box
                                key={index}
                                sx={{
                                    display: "flex",
                                    justifyContent: message.role === "user" ? "flex-end" : "flex-start",
                                    mb: 2,
                                }}
                            >
                                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, maxWidth: "80%" }}>
                                    {message.role === "assistant" && (
                                        <Avatar sx={{ bgcolor: "primary.main", width: 32, height: 32 }}>
                                            <SmartToy fontSize="small" />
                                        </Avatar>
                                    )}
                                    <Card sx={{ 
                                        bgcolor: message.role === "user" ? "primary.main" : "background.paper",
                                        color: message.role === "user" ? "white" : "text.primary",
                                        borderRadius: 0,
                                    }}>
                                        <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
                                            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                                                {message.content}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                    {message.role === "user" && (
                                        <Avatar sx={{ bgcolor: "secondary.main", width: 32, height: 32 }}>
                                            <Person fontSize="small" />
                                        </Avatar>
                                    )}
                                </Box>
                            </Box>
                        ))}
                        {loading && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Avatar sx={{ bgcolor: "primary.main", width: 32, height: 32 }}>
                                    <SmartToy fontSize="small" />
                                </Avatar>
                                <CircularProgress size={20} />
                            </Box>
                        )}
                        <div ref={messagesEndRef} />
                    </Container>
                </Box>

                {/* Input Area */}
                <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
                    <Container maxWidth="md">
                        <Box sx={{ display: "flex", gap: 1 }}>
                            <TextField
                                fullWidth
                                placeholder="Ask me anything about counseling, tracking progress, or managing individuals..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                multiline
                                maxRows={4}
                                disabled={loading}
                            />
                            <IconButton 
                                color="primary" 
                                onClick={handleSend}
                                disabled={!input.trim() || loading}
                                sx={{ alignSelf: "flex-end" }}
                            >
                                <Send />
                            </IconButton>
                        </Box>
                    </Container>
                </Box>
            </Box>
        </Box>
    )
}
