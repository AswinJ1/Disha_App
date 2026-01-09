"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession, signOut } from "next-auth/react"
import { useParams } from "next/navigation"
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    Avatar,
    AppBar,
    Toolbar,
    IconButton,
    Button,
    TextField,
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    Badge,
    Chip,
    LinearProgress,
    useMediaQuery,
    useTheme as useMuiTheme,
    Alert,
    Snackbar,
} from "@mui/material"
import {
    ArrowBack,
    People,
    Analytics,
    Notifications,
    Logout,
    Menu,
    CheckCircle,
    Schedule,
    Send,
    Home,
    DarkMode,
    LightMode,
    Message,
} from "@mui/icons-material"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts"
import Link from "next/link"
import { format, subDays } from "date-fns"
import { useThemeMode } from "@/theme/ThemeContext"

interface Individual {
    id: string
    name: string
    email: string
    tasks: Task[]
    feedbackReceived: Feedback[]
}

interface Task {
    id: string
    title: string
    date: string
    status: string
    completed: boolean
    completedAt: string | null
}

interface Feedback {
    id: string
    message: string
    createdAt: string
}

const drawerWidth = 260

export default function IndividualDetailPage() {
    const muiTheme = useMuiTheme()
    const { mode, toggleTheme } = useThemeMode()
    const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"))
    const { data: session } = useSession()
    const params = useParams()
    const [individual, setIndividual] = useState<Individual | null>(null)
    const [loading, setLoading] = useState(true)
    const [drawerOpen, setDrawerOpen] = useState(!isMobile)
    const [feedbackMessage, setFeedbackMessage] = useState("")
    const [sending, setSending] = useState(false)
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" })

    const fetchIndividual = useCallback(async () => {
        try {
            const res = await fetch(`/api/counselor/individual/${params.id}`)
            if (res.ok) {
                const data = await res.json()
                setIndividual(data)
            }
        } catch (error) {
            console.error("Failed to fetch individual:", error)
        } finally {
            setLoading(false)
        }
    }, [params.id])

    useEffect(() => {
        fetchIndividual()
    }, [fetchIndividual])

    useEffect(() => {
        setDrawerOpen(!isMobile)
    }, [isMobile])

    const handleSendFeedback = async () => {
        if (!feedbackMessage.trim()) return

        setSending(true)
        try {
            const res = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: feedbackMessage,
                    individualId: params.id,
                }),
            })

            if (res.ok) {
                setFeedbackMessage("")
                fetchIndividual()
                setSnackbar({ open: true, message: "Feedback sent successfully!", severity: "success" })
            } else {
                setSnackbar({ open: true, message: "Failed to send feedback", severity: "error" })
            }
        } catch (error) {
            console.error("Failed to send feedback:", error)
            setSnackbar({ open: true, message: "Error sending feedback", severity: "error" })
        } finally {
            setSending(false)
        }
    }

    const getWeeklyData = () => {
        if (!individual) return []
        return Array.from({ length: 7 }, (_, i) => {
            const date = subDays(new Date(), 6 - i)
            const dayTasks = individual.tasks.filter(
                (t) => format(new Date(t.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
            )
            return {
                day: format(date, "EEE"),
                completed: dayTasks.filter((t) => t.completed || t.status === "DONE").length,
                total: dayTasks.length,
            }
        })
    }

    const completedTasks = individual?.tasks.filter((t) => t.completed || t.status === "DONE").length || 0
    const totalTasks = individual?.tasks.length || 0
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

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

            <Box sx={{ flex: 1, overflow: "auto", p: 1 }}>
                <List>
                    <ListItemButton component={Link} href="/counselor" sx={{ borderRadius: 2 }}>
                        <ListItemIcon><Home /></ListItemIcon>
                        <ListItemText primary="Dashboard" />
                    </ListItemButton>
                    <ListItemButton selected sx={{ borderRadius: 2 }}>
                        <ListItemIcon><People sx={{ color: "primary.main" }} /></ListItemIcon>
                        <ListItemText primary="Individual Details" />
                    </ListItemButton>
                    <ListItemButton sx={{ borderRadius: 2 }}>
                        <ListItemIcon><Analytics /></ListItemIcon>
                        <ListItemText primary="Reports" />
                    </ListItemButton>
                </List>
            </Box>
        </Box>
    )

    if (loading) {
        return (
            <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default", justifyContent: "center", alignItems: "center" }}>
                <LinearProgress sx={{ width: 200 }} />
            </Box>
        )
    }

    if (!individual) {
        return (
            <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default", justifyContent: "center", alignItems: "center" }}>
                <Typography>Individual not found</Typography>
            </Box>
        )
    }

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
                    <IconButton component={Link} href="/counselor" color="inherit" sx={{ mr: 1 }}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h6" fontWeight={600} sx={{ flexGrow: 1 }}>
                        {individual.name}
                    </Typography>
                    <Badge badgeContent={2} color="error" sx={{ mr: 2 }}>
                        <IconButton color="inherit">
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

            {/* Main Content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { md: `calc(100% - ${drawerOpen ? drawerWidth : 0}px)` },
                    ml: { md: drawerOpen ? 0 : `-${drawerWidth}px` },
                    transition: "margin 0.3s, width 0.3s",
                }}
            >
                <Toolbar />
                <Container maxWidth="xl" disableGutters>
                    {/* Profile Header */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                                <Avatar sx={{ bgcolor: "primary.main", width: 64, height: 64, fontSize: "1.5rem" }}>
                                    {individual.name[0].toUpperCase()}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="h5" fontWeight={700}>
                                        {individual.name}
                                    </Typography>
                                    <Typography color="text.secondary">
                                        {individual.email}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: "flex", gap: 3 }}>
                                    <Box sx={{ textAlign: "center" }}>
                                        <Typography variant="h4" fontWeight={700} color="primary.main">
                                            {totalTasks}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">Total Tasks</Typography>
                                    </Box>
                                    <Box sx={{ textAlign: "center" }}>
                                        <Typography variant="h4" fontWeight={700} color="success.main">
                                            {completedTasks}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">Completed</Typography>
                                    </Box>
                                    <Box sx={{ textAlign: "center" }}>
                                        <Typography variant="h4" fontWeight={700} color="warning.main">
                                            {completionRate}%
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">Rate</Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>

                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 3 }}>
                        {/* Weekly Activity Chart */}
                        <Card>
                            <CardContent>
                                <Typography variant="h6" fontWeight={600} gutterBottom>
                                    Weekly Activity
                                </Typography>
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={getWeeklyData()}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={muiTheme.palette.divider} />
                                        <XAxis dataKey="day" stroke={muiTheme.palette.text.secondary} />
                                        <YAxis stroke={muiTheme.palette.text.secondary} />
                                        <Tooltip contentStyle={{ background: muiTheme.palette.background.paper, border: `1px solid ${muiTheme.palette.divider}` }} />
                                        <Bar dataKey="completed" name="Completed" fill={muiTheme.palette.success.main} radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="total" name="Total" fill={muiTheme.palette.primary.light} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Send Feedback */}
                        <Card>
                            <CardContent>
                                <Typography variant="h6" fontWeight={600} gutterBottom>
                                    <Message sx={{ mr: 1, verticalAlign: "middle" }} />
                                    Send Feedback
                                </Typography>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    placeholder="Write encouraging feedback for this individual..."
                                    value={feedbackMessage}
                                    onChange={(e) => setFeedbackMessage(e.target.value)}
                                    sx={{ mb: 2 }}
                                />
                                <Button
                                    variant="contained"
                                    startIcon={<Send />}
                                    onClick={handleSendFeedback}
                                    disabled={sending || !feedbackMessage.trim()}
                                >
                                    {sending ? "Sending..." : "Send Feedback"}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Recent Tasks */}
                        <Card>
                            <CardContent>
                                <Typography variant="h6" fontWeight={600} gutterBottom>
                                    Recent Tasks
                                </Typography>
                                {individual.tasks.slice(0, 5).map((task) => (
                                    <Box
                                        key={task.id}
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            py: 1,
                                            borderBottom: "1px solid",
                                            borderColor: "divider",
                                        }}
                                    >
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            {task.completed || task.status === "DONE" ? (
                                                <CheckCircle color="success" fontSize="small" />
                                            ) : (
                                                <Schedule color="warning" fontSize="small" />
                                            )}
                                            <Typography variant="body2">{task.title}</Typography>
                                        </Box>
                                        <Chip
                                            label={task.status}
                                            size="small"
                                            color={task.status === "DONE" ? "success" : task.status === "IN_PROGRESS" ? "warning" : "default"}
                                        />
                                    </Box>
                                ))}
                                {individual.tasks.length === 0 && (
                                    <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                                        No tasks yet
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>

                        {/* Feedback History */}
                        <Card>
                            <CardContent>
                                <Typography variant="h6" fontWeight={600} gutterBottom>
                                    Feedback History
                                </Typography>
                                {individual.feedbackReceived.map((feedback) => (
                                    <Box
                                        key={feedback.id}
                                        sx={{
                                            p: 1.5,
                                            mb: 1,
                                            bgcolor: "action.hover",
                                            borderRadius: 1,
                                        }}
                                    >
                                        <Typography variant="body2">{feedback.message}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {format(new Date(feedback.createdAt), "MMM d, yyyy")}
                                        </Typography>
                                    </Box>
                                ))}
                                {individual.feedbackReceived.length === 0 && (
                                    <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                                        No feedback sent yet
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Box>
                </Container>
            </Box>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    )
}
