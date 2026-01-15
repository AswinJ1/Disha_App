"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession, signOut } from "next-auth/react"
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    Button,
    TextField,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    Avatar,
    AppBar,
    Toolbar,
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    Badge,
    useMediaQuery,
    useTheme as useMuiTheme,
} from "@mui/material"
import toast from "react-hot-toast"
import {
    Add,
    Delete,
    CalendarMonth,
    Analytics,
    Notifications,
    Logout,
    Menu,
    EmojiEvents,
    ChevronLeft,
    ChevronRight,
    Home,
    DarkMode,
    LightMode,
    AccessTime,
    PlayArrow,
    Stop,
    Timer,
    Close,
    Message,
    CheckCircle as CheckCircleIcon,
    Edit,
    TableChart,
    Comment,
    SmartToy,
    Whatshot,
    HandymanSharp,
    Leaderboard,
} from "@mui/icons-material"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns"
import Link from "next/link"
import { useThemeMode } from "@/theme/ThemeContext"

interface TaskComment {
    id: string
    message: string
    createdAt: string
    author: {
        name: string
    }
}

interface Task {
    id: string
    title: string
    description: string
    date: string
    status: string
    completed: boolean
    completedAt: string | null
    estimatedMinutes: number | null
    actualMinutes: number | null
    startedAt: string | null
    aiReward: string | null
    comments?: TaskComment[]
}

interface Notification {
    id: string
    message: string
    type: string
    read: boolean
    createdAt: string
}

interface Feedback {
    id: string
    message: string
    createdAt: string
    counselor: {
        name: string
    }
}

interface MotivationalQuote {
    quote: string
    author: string
    personalMessage?: string
    pendingTasks?: number
    completedToday?: number
}

interface StreakData {
    currentStreak: number
    longestStreak: number
    completedDates: string[]
}

const COLUMNS = [
    { id: "TODO", title: "To Do", color: "#1976d2" },
    { id: "IN_PROGRESS", title: "In Progress", color: "#ed6c02" },
    { id: "DONE", title: "Done", color: "#2e7d32" },
]

const drawerWidth = 260
const notificationsWidth = 350

export default function IndividualDashboard() {
    const muiTheme = useMuiTheme()
    const { mode, toggleTheme } = useThemeMode()
    const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"))
    const { data: session } = useSession()
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [tasks, setTasks] = useState<Task[]>([])
    const [allTasks, setAllTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [newTask, setNewTask] = useState({ title: "", description: "", estimatedMinutes: "" })
    const [drawerOpen, setDrawerOpen] = useState(!isMobile)
    const [notificationsOpen, setNotificationsOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [activeTimer, setActiveTimer] = useState<string | null>(null)
    const [activeTimerStartedAt, setActiveTimerStartedAt] = useState<number | null>(null)
    const [timerDisplay, setTimerDisplay] = useState(0)
    const [feedback, setFeedback] = useState<Feedback[]>([])
    const [motivationalQuote, setMotivationalQuote] = useState<MotivationalQuote | null>(null)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [editTask, setEditTask] = useState<Task | null>(null)
    const [editForm, setEditForm] = useState({ title: "", description: "", estimatedMinutes: "" })
    const [streakData, setStreakData] = useState<StreakData>({ currentStreak: 0, longestStreak: 0, completedDates: [] })

    // Calculate streak data from tasks
    const calculateStreakData = useCallback((tasksList: Task[]) => {
        const completedTasks = tasksList.filter((t: Task) => t.status === "DONE" && t.completedAt)
        const completedDatesSet = new Set<string>()
        completedTasks.forEach((task: Task) => {
            if (task.completedAt) {
                completedDatesSet.add(format(new Date(task.completedAt), "yyyy-MM-dd"))
            }
        })
        const completedDates = Array.from(completedDatesSet).sort()
        
        // Calculate current streak
        let currentStreak = 0
        let longestStreak = 0
        let tempStreak = 0
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayStr = format(today, "yyyy-MM-dd")
        
        // Check backwards from today (or yesterday if today has no completions yet)
        const checkDate = new Date(today)
        
        // If today has completions, start from today
        // If not, start from yesterday (streak is still valid until end of today)
        if (!completedDatesSet.has(todayStr)) {
            checkDate.setDate(checkDate.getDate() - 1)
        }
        
        while (true) {
            const dateStr = format(checkDate, "yyyy-MM-dd")
            if (completedDatesSet.has(dateStr)) {
                currentStreak++
                checkDate.setDate(checkDate.getDate() - 1)
            } else {
                break
            }
        }
        
        // Calculate longest streak
        for (let i = 0; i < completedDates.length; i++) {
            if (i === 0) {
                tempStreak = 1
            } else {
                const prevDate = new Date(completedDates[i - 1])
                const currDate = new Date(completedDates[i])
                const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
                if (diffDays === 1) {
                    tempStreak++
                } else {
                    tempStreak = 1
                }
            }
            longestStreak = Math.max(longestStreak, tempStreak)
        }
        
        return { currentStreak, longestStreak, completedDates }
    }, [])

    const fetchTasks = useCallback(async (date: Date) => {
        try {
            const dateStr = format(date, "yyyy-MM-dd")
            const res = await fetch(`/api/tasks?date=${dateStr}`)
            if (res.ok) {
                const data = await res.json()
                setTasks(data)
            }
        } catch (error) {
            console.error("Failed to fetch tasks:", error)
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchAllTasks = useCallback(async () => {
        try {
            const res = await fetch("/api/tasks")
            if (res.ok) {
                const data = await res.json()
                setAllTasks(data)
                
                // Calculate and update streak data
                const newStreakData = calculateStreakData(data)
                setStreakData(newStreakData)
            }
        } catch (error) {
            console.error("Failed to fetch all tasks:", error)
        }
    }, [calculateStreakData])

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch("/api/notifications")
            if (res.ok) {
                const data = await res.json()
                setNotifications(data.notifications)
                setUnreadCount(data.unreadCount)
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error)
        }
    }, [])

    const fetchFeedback = useCallback(async () => {
        try {
            const res = await fetch("/api/feedback")
            if (res.ok) {
                const data = await res.json()
                setFeedback(data)
            }
        } catch (error) {
            console.error("Failed to fetch feedback:", error)
        }
    }, [])

    const fetchMotivationalQuote = useCallback(async () => {
        try {
            const res = await fetch("/api/motivational")
            if (res.ok) {
                const data = await res.json()
                setMotivationalQuote(data)
            }
        } catch (error) {
            console.error("Failed to fetch motivational quote:", error)
        }
    }, [])

    const markNotificationsRead = async () => {
        try {
            await fetch("/api/notifications", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ markAllRead: true }),
            })
            setUnreadCount(0)
            setNotifications(notifications.map(n => ({ ...n, read: true })))
        } catch (error) {
            console.error("Failed to mark notifications read:", error)
        }
    }

    useEffect(() => {
        fetchTasks(selectedDate)
    }, [selectedDate, fetchTasks])

    useEffect(() => {
        fetchAllTasks()
        fetchNotifications()
        fetchFeedback()
        fetchMotivationalQuote()
    }, [fetchAllTasks, fetchNotifications, fetchFeedback, fetchMotivationalQuote])

    useEffect(() => {
        setDrawerOpen(!isMobile)
    }, [isMobile])

    // Timer effect - calculates elapsed time from startedAt timestamp
    useEffect(() => {
        let interval: NodeJS.Timeout
        if (activeTimer && activeTimerStartedAt) {
            // Get the task to include previous accumulated time
            const task = tasks.find(t => t.id === activeTimer)
            const previousSeconds = (task?.actualMinutes || 0) * 60
            
            // Update display immediately
            const elapsed = Math.floor((Date.now() - activeTimerStartedAt) / 1000) + previousSeconds
            setTimerDisplay(elapsed)
            
            interval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - activeTimerStartedAt) / 1000) + previousSeconds
                setTimerDisplay(elapsed)
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [activeTimer, activeTimerStartedAt, tasks])

    // Restore active timer from tasks on load
    useEffect(() => {
        // Find any task with startedAt that is IN_PROGRESS (timer was running)
        const runningTask = tasks.find(t => t.startedAt && t.status === "IN_PROGRESS")
        if (runningTask && runningTask.startedAt) {
            setActiveTimer(runningTask.id)
            setActiveTimerStartedAt(new Date(runningTask.startedAt).getTime())
        } else if (activeTimer) {
            // Check if the active timer task is still in progress
            const currentTask = tasks.find(t => t.id === activeTimer)
            if (!currentTask || currentTask.status === "DONE" || !currentTask.startedAt) {
                setActiveTimer(null)
                setActiveTimerStartedAt(null)
                setTimerDisplay(0)
            }
        }
    }, [tasks])

    const handleAddTask = async () => {
        if (!newTask.title.trim()) return

        try {
            const dateStr = format(selectedDate, "yyyy-MM-dd")
            const res = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...newTask,
                    date: dateStr,
                }),
            })

            if (res.ok) {
                setDialogOpen(false)
                setNewTask({ title: "", description: "", estimatedMinutes: "" })
                fetchTasks(selectedDate)
                fetchAllTasks()
                toast.success("Task created successfully!")
            } else {
                const error = await res.json()
                toast.error(error.error || "Failed to create task")
            }
        } catch (error) {
            console.error("Failed to add task:", error)
            toast.error("Network error. Please try again.")
        }
    }

    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination) return

        const { draggableId, destination, source } = result
        const newStatus = destination.droppableId
        const oldStatus = source.droppableId

        // If dropped in the same column, no need to update
        if (newStatus === oldStatus) return

        // Optimistic update - update UI immediately
        const taskToUpdate = tasks.find(t => t.id === draggableId)
        if (taskToUpdate) {
            const updatedTask = { 
                ...taskToUpdate, 
                status: newStatus,
                completed: newStatus === "DONE",
                completedAt: newStatus === "DONE" ? new Date().toISOString() : null
            }
            const newTasks = tasks.map(t => t.id === draggableId ? updatedTask : t)
            const newAllTasks = allTasks.map(t => t.id === draggableId ? updatedTask : t)
            
            setTasks(newTasks)
            setAllTasks(newAllTasks)
            
            // Recalculate streak data immediately for optimistic update
            const newStreakData = calculateStreakData(newAllTasks)
            setStreakData(newStreakData)
        }

        try {
            const res = await fetch("/api/tasks", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: draggableId, status: newStatus }),
            })

            if (res.ok) {
                const updatedTask = await res.json()
                // Update with server response to ensure consistency
                setTasks(prevTasks => 
                    prevTasks.map(t => t.id === draggableId ? updatedTask : t)
                )
                setAllTasks(prevTasks => {
                    const updated = prevTasks.map(t => t.id === draggableId ? updatedTask : t)
                    // Recalculate streak with server data
                    const newStreakData = calculateStreakData(updated)
                    setStreakData(newStreakData)
                    return updated
                })
                if (updatedTask.status === "DONE" && updatedTask.aiReward) {
                    toast.success(updatedTask.aiReward, { duration: 5000 })
                }
            } else {
                // Revert on error - refetch to restore correct state
                fetchTasks(selectedDate)
                fetchAllTasks()
            }
        } catch (error) {
            console.error("Failed to update task status:", error)
            // Revert on error - refetch to restore correct state
            fetchTasks(selectedDate)
            fetchAllTasks()
        }
    }

    const handleDeleteTask = async (id: string) => {
        try {
            const res = await fetch(`/api/tasks?id=${id}`, { method: "DELETE" })
            if (res.ok) {
                fetchTasks(selectedDate)
                fetchAllTasks()
            }
        } catch (error) {
            console.error("Failed to delete task:", error)
        }
    }

    const handleOpenEditDialog = (task: Task) => {
        setEditTask(task)
        setEditForm({
            title: task.title,
            description: task.description || "",
            estimatedMinutes: task.estimatedMinutes?.toString() || "",
        })
        setEditDialogOpen(true)
    }

    const handleEditTask = async () => {
        if (!editTask || !editForm.title.trim()) return

        try {
            const res = await fetch("/api/tasks", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: editTask.id,
                    title: editForm.title,
                    description: editForm.description,
                    estimatedMinutes: editForm.estimatedMinutes,
                }),
            })

            if (res.ok) {
                setEditDialogOpen(false)
                setEditTask(null)
                fetchTasks(selectedDate)
                fetchAllTasks()
                toast.success("Task updated successfully!")
            }
        } catch (error) {
            console.error("Failed to update task:", error)
            toast.error("Failed to update task")
        }
    }

    const handleStartTimer = async (taskId: string) => {
        if (activeTimer === taskId) {
            // Stop timer - use activeTimerStartedAt (guaranteed to be set) for calculation
            const task = tasks.find(t => t.id === taskId)
            const previousMinutes = task?.actualMinutes || 0
            
            // Use activeTimerStartedAt which we stored when starting - more reliable than task.startedAt
            let actualMinutes = previousMinutes
            if (activeTimerStartedAt) {
                const elapsedSeconds = Math.floor((Date.now() - activeTimerStartedAt) / 1000)
                // Add elapsed minutes to existing actualMinutes (accumulate time)
                const elapsedMinutes = Math.floor(elapsedSeconds / 60)
                actualMinutes = previousMinutes + elapsedMinutes
            }
            
            // Clear local state first
            setActiveTimer(null)
            setActiveTimerStartedAt(null)
            setTimerDisplay(0)
            
            try {
                await fetch("/api/tasks", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: taskId, actualMinutes, startedAt: null }),
                })
                fetchTasks(selectedDate)
                fetchAllTasks()
            } catch (error) {
                console.error("Failed to save time:", error)
            }
        } else {
            // Start timer - store startedAt in database (don't reset actualMinutes)
            const startTime = Date.now()
            
            // Set local state immediately for responsive UI
            setActiveTimer(taskId)
            setActiveTimerStartedAt(startTime)
            
            try {
                await fetch("/api/tasks", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: taskId, startedAt: new Date(startTime).toISOString(), status: "IN_PROGRESS" }),
                })
                fetchTasks(selectedDate)
            } catch (error) {
                console.error("Failed to start timer:", error)
                // Revert local state on error
                setActiveTimer(null)
                setActiveTimerStartedAt(null)
            }
        }
    }

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600)
        const mins = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60
        if (hrs > 0) {
            return `${hrs}h ${mins}m ${secs}s`
        }
        if (mins > 0) {
            return `${mins}m ${secs}s`
        }
        return `${secs}s`
    }

    const handleOpenNotifications = () => {
        setNotificationsOpen(true)
        if (unreadCount > 0) {
            markNotificationsRead()
        }
    }

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
    })

    const getTasksForDay = (day: Date) => {
        return allTasks.filter((task) => isSameDay(new Date(task.date), day))
    }

    const getTasksByStatus = (status: string) => {
        return tasks.filter((task) => task.status === status)
    }

    const sidebarContent = (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar sx={{ bgcolor: "primary.main", width: 32, height: 32, fontSize: "0.875rem" }}>
                        {session?.user?.name?.[0]?.toUpperCase() || "U"}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                            {session?.user?.name || "User"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Individual
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={toggleTheme}>
                        {mode === "light" ? <DarkMode /> : <LightMode />}
                    </IconButton>
                </Box>
            </Box>

            <Box sx={{ flex: 1, overflow: "auto", p: 1 }}>
                <List>
                    <ListItemButton selected>
                        <ListItemIcon><Home sx={{ color: "primary.main" }} /></ListItemIcon>
                        <ListItemText primary="Kanban Board" />
                    </ListItemButton>
                    <ListItemButton component={Link} href="/individual/tasks">
                        <ListItemIcon><TableChart /></ListItemIcon>
                        <ListItemText primary="Tasks Table" />
                    </ListItemButton>
                    <ListItemButton component={Link} href="/individual/leaderboard">
                        <ListItemIcon><Leaderboard /></ListItemIcon>
                        <ListItemText primary="Leaderboard" />
                    </ListItemButton>
                    <ListItemButton component={Link} href="/individual/analytics">
                        <ListItemIcon><Analytics /></ListItemIcon>
                        <ListItemText primary="Analytics" />
                    </ListItemButton>
                    <ListItemButton component={Link} href="/individual/ai-assistant">
                        <ListItemIcon><SmartToy /></ListItemIcon>
                        <ListItemText primary="AI Assistant" />
                    </ListItemButton>
                </List>

                <Divider sx={{ my: 2 }} />

                {/* Mini Calendar */}
                <Typography variant="caption" color="text.secondary" sx={{ px: 2, fontWeight: 600, textTransform: "uppercase" }}>
                    Calendar
                </Typography>
                <Box sx={{ px: 1, mt: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                        <IconButton size="small" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                            <ChevronLeft fontSize="small" />
                        </IconButton>
                        <Typography variant="caption" fontWeight={600}>
                            {format(currentMonth, "MMM yyyy")}
                        </Typography>
                        <IconButton size="small" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                            <ChevronRight fontSize="small" />
                        </IconButton>
                    </Box>
                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.25, textAlign: "center" }}>
                        {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                            <Typography key={i} variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>
                                {day}
                            </Typography>
                        ))}
                        {Array(startOfMonth(currentMonth).getDay()).fill(null).map((_, i) => (
                            <Box key={`empty-${i}`} />
                        ))}
                        {daysInMonth.map((day) => {
                            const dayTasks = getTasksForDay(day)
                            const isSelected = isSameDay(day, selectedDate)
                            const isToday = isSameDay(day, new Date())
                            const dateStr = format(day, "yyyy-MM-dd")
                            const hasCompletedTask = streakData.completedDates.includes(dateStr)

                            return (
                                <Box
                                    key={day.toISOString()}
                                    onClick={() => setSelectedDate(day)}
                                    sx={{
                                        py: 0.25,
                                        cursor: "pointer",
                                        bgcolor: isSelected ? "primary.main" : hasCompletedTask ? "success.light" : "transparent",
                                        color: isSelected ? "white" : hasCompletedTask ? "success.dark" : "inherit",
                                        fontWeight: isToday ? 700 : 400,
                                        fontSize: "0.7rem",
                                        "&:hover": { bgcolor: isSelected ? "primary.main" : "action.hover" },
                                    }}
                                >
                                    {format(day, "d")}
                                    {dayTasks.length > 0 && (
                                        <Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: isSelected ? "white" : "primary.main", mx: "auto", mt: 0.25 }} />
                                    )}
                                </Box>
                            )
                        })}
                    </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Streak Stats */}
                <Typography variant="caption" color="text.secondary" sx={{ px: 2, fontWeight: 600, textTransform: "uppercase" }}>
                    Streaks
                </Typography>
                <Box sx={{ px: 2, mt: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                        <Whatshot sx={{ color: streakData.currentStreak > 0 ? "warning.main" : "text.disabled", fontSize: 28 }} />
                        <Box>
                            <Typography variant="h5" fontWeight={700} color={streakData.currentStreak > 0 ? "warning.main" : "text.secondary"}>
                                {streakData.currentStreak}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Current Streak
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <EmojiEvents sx={{ color: "success.main", fontSize: 24 }} />
                        <Box>
                            <Typography variant="h6" fontWeight={600} color="success.main">
                                {streakData.longestStreak}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Longest Streak
                            </Typography>
                        </Box>
                    </Box>
                    {streakData.currentStreak >= 3 && (
                        <Chip 
                            icon={<Whatshot />} 
                            label="On Fire! 🔥" 
                            color="warning" 
                            size="small" 
                            sx={{ mt: 1, width: "100%" }}
                        />
                    )}
                </Box>
            </Box>
        </Box>
    )

    return (
        <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
            {/* App Bar */}
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
                    <CalendarMonth sx={{ mr: 1, color: "primary.main" }} />
                    <Typography variant="h6" fontWeight={600} sx={{ flexGrow: 1 }}>
                        {format(selectedDate, "EEEE, MMMM d")}
                    </Typography>
                    <Badge badgeContent={unreadCount} color="error" sx={{ mr: 2 }}>
                        <IconButton color="inherit" onClick={handleOpenNotifications}>
                            <Notifications />
                        </IconButton>
                    </Badge>
                    <IconButton color="inherit" onClick={() => signOut({ callbackUrl: "/login" })}>
                        <Logout />
                    </IconButton>
                </Toolbar>
            </AppBar>

            {/* Sidebar */}
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

            {/* Notifications Drawer */}
            <Drawer
                anchor="right"
                open={notificationsOpen}
                onClose={() => setNotificationsOpen(false)}
                sx={{
                    "& .MuiDrawer-paper": {
                        width: isMobile ? "100%" : notificationsWidth,
                        boxSizing: "border-box",
                        bgcolor: "background.paper",
                    },
                }}
            >
                <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Typography variant="h6" fontWeight={600}>
                        <Notifications sx={{ mr: 1, verticalAlign: "middle" }} />
                        Notifications & Feedback
                    </Typography>
                    <IconButton onClick={() => setNotificationsOpen(false)}>
                        <Close />
                    </IconButton>
                </Box>
                <Box sx={{ p: 2, overflow: "auto", flex: 1 }}>
                    {notifications.length === 0 ? (
                        <Box sx={{ textAlign: "center", py: 4 }}>
                            <Message sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
                            <Typography color="text.secondary">
                                No notifications yet
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Feedback from your counselor will appear here
                            </Typography>
                        </Box>
                    ) : (
                        notifications.map((notification) => (
                            <Card
                                key={notification.id}
                                sx={{
                                    mb: 2,
                                    bgcolor: notification.read ? "background.paper" : "action.hover",
                                    borderLeft: notification.type === "FEEDBACK" ? "3px solid" : "none",
                                    borderColor: "primary.main",
                                }}
                            >
                                <CardContent sx={{ py: 1.5 }}>
                                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                                        {notification.type === "FEEDBACK" ? (
                                            <Message color="primary" fontSize="small" />
                                        ) : (
                                            <CheckCircleIcon color="success" fontSize="small" />
                                        )}
                                        <Box sx={{ flex: 1 }}>
                                            <Chip
                                                label={notification.type === "FEEDBACK" ? "Counselor Feedback" : notification.type}
                                                size="small"
                                                color={notification.type === "FEEDBACK" ? "primary" : "default"}
                                                sx={{ mb: 1, height: 20, fontSize: "0.65rem" }}
                                            />
                                            <Typography variant="body2">
                                                {notification.message}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {format(new Date(notification.createdAt), "MMM d, yyyy 'at' h:mm a")}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </Box>
            </Drawer>

            {/* Main Content - Kanban Board */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 2,
                    width: { md: `calc(100% - ${drawerOpen ? drawerWidth : 0}px)` },
                    ml: { md: drawerOpen ? 0 : `-${drawerWidth}px` },
                    transition: "margin 0.3s, width 0.3s",
                    overflow: "auto",
                }}
            >
                <Toolbar />

                {/* Motivational Banner */}
                {motivationalQuote && (
                    <Card
                        sx={{
                            mb: 3,
                            position: "relative",
                            overflow: "hidden",
                            borderRadius: 0,
                        }}
                    >
                        <CardContent sx={{ py: 3 }}>
                            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                                <EmojiEvents sx={{ fontSize: 40, opacity: 0.9 }} />
                                <Box sx={{ flex: 1 }}>
                                          <Typography variant="h6" color="text.secondary" gutterBottom>
                            Hello, {session?.user?.name || "User"}! 👋
                        </Typography>
                                    <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                                        Daily Motivation
                                    </Typography>
                                    {/* {motivationalQuote.personalMessage && (
                                        <Chip
                                            label={motivationalQuote.personalMessage}
                                            sx={{
                                                mb: 1.5,
                                                bgcolor: "rgba(255,255,255,0.2)",
                                                color: "white",
                                                fontWeight: 600,
                                                "& .MuiChip-label": { px: 1.5 },
                                            }}
                                            size="small"
                                        />
                                    )} */}
                                    <Typography variant="body1" sx={{ fontStyle: "bold", mb: 1, opacity: 0.95 }}>
                                        "{motivationalQuote.quote}"
                                    </Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                        — {motivationalQuote.author}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                )}

                {/* Counselor Feedback Section */}
                {feedback.length > 0 && (
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                                <Message color="primary" />
                                Messages from Your Mentor
                                <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
                                    {format(selectedDate, "MMM d, yyyy")}
                                </Typography>
                            </Typography>
                            <Box sx={{ maxHeight: 200, overflow: "auto" }}>
                                {(() => {
                                    const feedbackForDate = feedback.filter((fb) => 
                                        format(new Date(fb.createdAt), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
                                    )
                                    if (feedbackForDate.length === 0) {
                                        return (
                                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
                                                No feedback for this date
                                            </Typography>
                                        )
                                    }
                                    return feedbackForDate.map((fb) => (
                                        <Box
                                            key={fb.id}
                                            sx={{
                                                p: 2,
                                                mb: 1,
                                                bgcolor: "action.hover",
                                                borderRadius: 0,
                                                borderLeft: "4px solid",
                                                borderColor: "primary.main",
                                            }}
                                        >
                                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                {fb.message}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                From {fb.counselor.name} • {format(new Date(fb.createdAt), "h:mm a")}
                                            </Typography>
                                        </Box>
                                    ))
                                })()}
                            </Box>
                        </CardContent>
                    </Card>
                )}

                <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                    <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>
                        Add Task
                    </Button>
                </Box>

                {/* Kanban Board */}
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                            gap: 2,
                            minHeight: "calc(100vh - 180px)",
                        }}
                    >
                        {COLUMNS.map((column) => (
                            <Box key={column.id}>
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        mb: 1.5,
                                        px: 1,
                                    }}
                                >
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <Box sx={{ width: 8, height: 8, borderRadius: "50%"}} />
                                        <Typography variant="subtitle1" fontWeight={600}>
                                            {column.title}
                                        </Typography>
                                    </Box>
                                    <Chip label={getTasksByStatus(column.id).length} size="small" />
                                </Box>

                                <Droppable droppableId={column.id}>
                                    {(provided, snapshot) => (
                                        <Box
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            sx={{
                                                bgcolor: snapshot.isDraggingOver ? "action.hover" : "background.paper",
                                                border: "1px solid",
                                                borderColor: snapshot.isDraggingOver ? "primary.main" : "divider",
                                                borderRadius: 0,
                                                p: 1,
                                                minHeight: 400,
                                                transition: "all 0.2s",
                                            }}
                                        >
                                            {getTasksByStatus(column.id).map((task, index) => (
                                                <Draggable key={task.id} draggableId={task.id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <Card
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            sx={{
                                                                mb: 1,
                                                                bgcolor: snapshot.isDragging ? "action.selected" : "background.paper",
                                                                boxShadow: snapshot.isDragging ? 4 : 1,
                                                                cursor: "grab",
                                                                "&:active": { cursor: "grabbing" },
                                                                borderRadius: 0,
                                                            }}
                                                        >
                                                            <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                                                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                                                    <Typography variant="body2" fontWeight={600}>
                                                                        {task.title}
                                                                    </Typography>
                                                                    <Box sx={{ display: "flex", gap: 0.5 }}>
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                handleOpenEditDialog(task)
                                                                            }}
                                                                            sx={{ mt: -0.5 }}
                                                                        >
                                                                            <Edit fontSize="small" />
                                                                        </IconButton>
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={() => handleDeleteTask(task.id)}
                                                                            sx={{ mt: -0.5 }}
                                                                        >
                                                                            <Delete fontSize="small" />
                                                                        </IconButton>
                                                                    </Box>
                                                                </Box>

                                                                {task.description && (
                                                                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                                                                        {task.description}
                                                                    </Typography>
                                                                )}

                                                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>
                                                                    {task.estimatedMinutes && (
                                                                        <Chip
                                                                            icon={<AccessTime sx={{ fontSize: "0.875rem" }} />}
                                                                            label={`Est: ${task.estimatedMinutes}m`}
                                                                            size="small"
                                                                            variant="outlined"
                                                                            sx={{ height: 22, "& .MuiChip-label": { px: 0.75, fontSize: "0.7rem" } }}
                                                                        />
                                                                    )}
                                                                    {(task.actualMinutes || activeTimer === task.id) && (
                                                                        <Chip
                                                                            icon={<Timer sx={{ fontSize: "0.875rem" }} />}
                                                                            label={activeTimer === task.id ? formatTime(timerDisplay) : `${task.actualMinutes}m`}
                                                                            size="small"
                                                                            color={activeTimer === task.id ? "warning" : "success"}
                                                                            sx={{ height: 22, "& .MuiChip-label": { px: 0.75, fontSize: "0.7rem" } }}
                                                                        />
                                                                    )}
                                                                </Box>

                                                                {column.id !== "DONE" && (
                                                                    <Box sx={{ mt: 1 }}>
                                                                        <Button
                                                                            size="small"
                                                                            variant={activeTimer === task.id ? "contained" : "outlined"}
                                                                            color={activeTimer === task.id ? "error" : "primary"}
                                                                            startIcon={activeTimer === task.id ? <Stop /> : <PlayArrow />}
                                                                            onClick={() => handleStartTimer(task.id)}
                                                                            sx={{ height: 24, fontSize: "0.7rem" }}
                                                                        >
                                                                            {activeTimer === task.id ? "Stop" : "Start"}
                                                                        </Button>
                                                                    </Box>
                                                                )}

                                                                {task.comments && task.comments.length > 0 && (
                                                                    <Chip
                                                                        icon={<Comment sx={{ fontSize: "0.875rem" }} />}
                                                                        label={`${task.comments.length} comment${task.comments.length > 1 ? "s" : ""}`}
                                                                        size="small"
                                                                        color="primary"
                                                                        variant="outlined"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            handleOpenEditDialog(task)
                                                                        }}
                                                                        sx={{ mt: 1, height: 22, "& .MuiChip-label": { fontSize: "0.65rem" }, cursor: "pointer" }}
                                                                    />
                                                                )}
                                                            </CardContent>
                                                        </Card>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}

                                            {getTasksByStatus(column.id).length === 0 && (
                                                <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
                                                    <Typography variant="body2">Drop tasks here</Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    )}
                                </Droppable>
                            </Box>
                        ))}
                    </Box>
                </DragDropContext>
            </Box>

            {/* Add Task Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add New Task</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        label="Task Title"
                        fullWidth
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        sx={{ mt: 2, mb: 2 }}
                    />
                    <TextField
                        label="Description (optional)"
                        fullWidth
                        multiline
                        rows={2}
                        value={newTask.description}
                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        label="Estimated Time (minutes)"
                        fullWidth
                        type="number"
                        value={newTask.estimatedMinutes}
                        onChange={(e) => setNewTask({ ...newTask, estimatedMinutes: e.target.value })}
                        InputProps={{
                            endAdornment: <Typography color="text.secondary">min</Typography>,
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleAddTask}>Add Task</Button>
                </DialogActions>
            </Dialog>

            {/* Edit Task Dialog */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Edit color="primary" />
                    Edit Task
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        label="Task Title"
                        fullWidth
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        sx={{ mt: 2, mb: 2 }}
                    />
                    <TextField
                        label="Description (optional)"
                        fullWidth
                        multiline
                        rows={2}
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        label="Estimated Time (minutes)"
                        fullWidth
                        type="number"
                        value={editForm.estimatedMinutes}
                        onChange={(e) => setEditForm({ ...editForm, estimatedMinutes: e.target.value })}
                        InputProps={{
                            endAdornment: <Typography color="text.secondary">min</Typography>,
                        }}
                    />
                    {/* Show task comments */}
                    {editTask?.comments && editTask.comments.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                                <Comment fontSize="small" color="primary" />
                                Counselor Comments
                            </Typography>
                            {editTask.comments.map((comment) => (
                                <Box
                                    key={comment.id}
                                    sx={{
                                        p: 1.5,
                                        mb: 1,
                                        bgcolor: "action.hover",
                                        borderRadius: 1,
                                        borderLeft: "3px solid",
                                        borderColor: "primary.main",
                                    }}
                                >
                                    <Typography variant="body2">{comment.message}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {comment.author.name} • {format(new Date(comment.createdAt), "MMM d, yyyy")}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleEditTask} disabled={!editForm.title.trim()}>
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}
