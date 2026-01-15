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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Skeleton,
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
    HourglassEmpty,
    AccessTime,
    Leaderboard,
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
import { format, subDays, subMonths } from "date-fns"
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
    description?: string
    date: string
    status: string
    completed: boolean
    completedAt: string | null
    actualMinutes: number | null
    estimatedMinutes: number | null
    updatedAt?: string
    createdAt?: string
}

interface Feedback {
    id: string
    message: string
    createdAt: string
}

const drawerWidth = 260

// Tab panel component
interface TabPanelProps {
    children?: React.ReactNode
    index: number
    value: number
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`task-tabpanel-${index}`}
            aria-labelledby={`task-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
        </div>
    )
}

function formatMinutes(minutes: number | null): string {
    if (minutes === null || minutes === undefined) return "—"
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

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
    const [timeRange, setTimeRange] = useState("week")
    
    // Task table state
    const [taskTabValue, setTaskTabValue] = useState(0)
    const [inProgressPage, setInProgressPage] = useState(0)
    const [completedPage, setCompletedPage] = useState(0)
    const pageSize = 10

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

    // Get time range in days based on selection
    const getTimeRangeDays = () => {
        switch (timeRange) {
            case "week": return 7
            case "month": return 30
            case "2months": return 60
            case "3months": return 90
            case "6months": return 180
            case "year": return 365
            default: return 7
        }
    }

    // Filter tasks based on time range
    const getFilteredTasks = () => {
        if (!individual) return []
        const days = getTimeRangeDays()
        const startDate = subDays(new Date(), days)
        return individual.tasks.filter(t => new Date(t.date) >= startDate)
    }

    const getWeeklyData = () => {
        if (!individual) return []
        const days = getTimeRangeDays()
        
        if (days > 60) {
            // Aggregate by month for longer periods
            const months = Math.ceil(days / 30)
            return Array.from({ length: months }, (_, i) => {
                const monthStart = subMonths(new Date(), months - 1 - i)
                const monthEnd = subMonths(new Date(), months - 2 - i)
                const monthTasks = individual.tasks.filter((t) => {
                    const taskDate = new Date(t.date)
                    return taskDate >= monthStart && taskDate < (i === months - 1 ? new Date() : monthEnd)
                })
                return {
                    day: format(monthStart, "MMM"),
                    completed: monthTasks.filter((t) => t.completed || t.status === "DONE").length,
                    total: monthTasks.length,
                    hours: Math.round(monthTasks.reduce((acc, t) => acc + (t.actualMinutes || 0), 0) / 60 * 10) / 10,
                }
            })
        }
        
        return Array.from({ length: days }, (_, i) => {
            const date = subDays(new Date(), days - 1 - i)
            const dayTasks = individual.tasks.filter(
                (t) => format(new Date(t.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
            )
            return {
                day: format(date, days <= 7 ? "EEE" : "MMM d"),
                completed: dayTasks.filter((t) => t.completed || t.status === "DONE").length,
                total: dayTasks.length,
                hours: Math.round(dayTasks.reduce((acc, t) => acc + (t.actualMinutes || 0), 0) / 60 * 10) / 10,
            }
        })
    }

    const filteredTasks = getFilteredTasks()
    const completedTasks = filteredTasks.filter((t) => t.completed || t.status === "DONE").length
    const totalTasks = filteredTasks.length
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    const totalHoursSpent = Math.round(filteredTasks.reduce((acc, t) => acc + (t.actualMinutes || 0), 0) / 60 * 10) / 10
    const totalEstimatedHours = Math.round(filteredTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0) / 60 * 10) / 10

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
                    <ListItemButton component={Link} href="/counselor" sx={{ borderRadius: 0 }}>
                        <ListItemIcon><Home /></ListItemIcon>
                        <ListItemText primary="Dashboard" />
                    </ListItemButton>
                    <ListItemButton selected sx={{ borderRadius: 0 }}>
                        <ListItemIcon><People sx={{ color: "primary.main" }} /></ListItemIcon>
                        <ListItemText primary="Individual Details" />
                    </ListItemButton>
                    <ListItemButton component={Link} href="/counselor/leaderboard" sx={{ borderRadius: 0 }}>
                        <ListItemIcon><Leaderboard /></ListItemIcon>
                        <ListItemText primary="Leaderboard" />
                    </ListItemButton>
                    <ListItemButton sx={{ borderRadius: 0 }}>
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
                    <Card sx={{ mb: 3, borderRadius: 0 }}>
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
                                <FormControl size="small" sx={{ minWidth: 140 }}>
                                    <InputLabel>Time Range</InputLabel>
                                    <Select
                                        value={timeRange}
                                        label="Time Range"
                                        onChange={(e) => setTimeRange(e.target.value)}
                                    >
                                        <MenuItem value="week">Last 7 Days</MenuItem>
                                        <MenuItem value="month">Last 30 Days</MenuItem>
                                        <MenuItem value="2months">Last 2 Months</MenuItem>
                                        <MenuItem value="3months">Last 3 Months</MenuItem>
                                        <MenuItem value="6months">Last 6 Months</MenuItem>
                                        <MenuItem value="year">Last 12 Months</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Stats Cards */}
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(5, 1fr)" }, gap: 2, mb: 3 }}>
                        <Card sx={{ borderRadius: 0 }}>
                            <CardContent sx={{ textAlign: "center" }}>
                                <Typography variant="h4" fontWeight={700} color="primary.main">
                                    {totalTasks}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">Total Tasks</Typography>
                            </CardContent>
                        </Card>
                        <Card sx={{ borderRadius: 0 }}>
                            <CardContent sx={{ textAlign: "center" }}>
                                <Typography variant="h4" fontWeight={700} color="success.main">
                                    {completedTasks}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">Completed</Typography>
                            </CardContent>
                        </Card>
                        <Card sx={{ borderRadius: 0 }}>
                            <CardContent sx={{ textAlign: "center" }}>
                                <Typography variant="h4" fontWeight={700} color="warning.main">
                                    {completionRate}%
                                </Typography>
                                <Typography variant="caption" color="text.secondary">Rate</Typography>
                            </CardContent>
                        </Card>
                        <Card sx={{ borderRadius: 0 }}>
                            <CardContent sx={{ textAlign: "center" }}>
                                <Typography variant="h4" fontWeight={700} color="info.main">
                                    {totalHoursSpent}h
                                </Typography>
                                <Typography variant="caption" color="text.secondary">Hours Spent</Typography>
                            </CardContent>
                        </Card>
                        <Card sx={{ borderRadius: 0 }}>
                            <CardContent sx={{ textAlign: "center" }}>
                                <Typography variant="h4" fontWeight={700} color="secondary.main">
                                    {totalEstimatedHours}h
                                </Typography>
                                <Typography variant="caption" color="text.secondary">Estimated</Typography>
                            </CardContent>
                        </Card>
                    </Box>

                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 3, mb: 3 }}>
                        {/* Activity Chart */}
                        <Card sx={{ borderRadius: 0 }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight={600} gutterBottom>
                                    Activity Overview
                                </Typography>
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={getWeeklyData()}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={muiTheme.palette.divider} />
                                        <XAxis dataKey="day" stroke={muiTheme.palette.text.secondary} />
                                        <YAxis stroke={muiTheme.palette.text.secondary} />
                                        <Tooltip contentStyle={{ background: muiTheme.palette.background.paper, border: `1px solid ${muiTheme.palette.divider}` }} />
                                        <Bar dataKey="completed" name="Completed" fill={muiTheme.palette.success.main} radius={[0, 0, 0, 0]} />
                                        <Bar dataKey="total" name="Total" fill={muiTheme.palette.primary.light} radius={[0, 0, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Send Feedback */}
                        <Card sx={{ borderRadius: 0 }}>
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
                    </Box>

                    {/* Tasks Table with Tabs */}
                    <Card sx={{ mb: 3, borderRadius: 0 }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                Tasks Overview
                            </Typography>
                            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                                <Tabs
                                    value={taskTabValue}
                                    onChange={(_, newValue) => {
                                        setTaskTabValue(newValue)
                                        if (newValue === 0) setInProgressPage(0)
                                        else setCompletedPage(0)
                                    }}
                                    sx={{
                                        "& .MuiTab-root": {
                                            textTransform: "none",
                                            fontWeight: 600,
                                        },
                                    }}
                                >
                                    <Tab
                                        icon={<HourglassEmpty sx={{ color: "#1976d2" }} />}
                                        iconPosition="start"
                                        label={`In Progress (${individual.tasks.filter(t => t.status === "IN_PROGRESS" || t.status === "TODO").length})`}
                                    />
                                    <Tab
                                        icon={<CheckCircle sx={{ color: "#2e7d32" }} />}
                                        iconPosition="start"
                                        label={`Completed (${individual.tasks.filter(t => t.status === "DONE").length})`}
                                    />
                                </Tabs>
                            </Box>

                            {/* In Progress Tab */}
                            <TabPanel value={taskTabValue} index={0}>
                                {(() => {
                                    const inProgressTasks = individual.tasks.filter(t => t.status === "IN_PROGRESS" || t.status === "TODO")
                                    const paginatedTasks = inProgressTasks.slice(inProgressPage * pageSize, (inProgressPage + 1) * pageSize)
                                    
                                    return (
                                        <>
                                            <TableContainer>
                                                <Table size="small">
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell sx={{ fontWeight: 600 }}>Task</TableCell>
                                                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                                            <TableCell sx={{ fontWeight: 600 }}>Estimated</TableCell>
                                                            <TableCell sx={{ fontWeight: 600 }}>Actual</TableCell>
                                                            <TableCell sx={{ fontWeight: 600 }}>Updated</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {paginatedTasks.length === 0 ? (
                                                            <TableRow>
                                                                <TableCell colSpan={5} sx={{ textAlign: "center", py: 4 }}>
                                                                    <Typography color="text.secondary">No in-progress tasks</Typography>
                                                                </TableCell>
                                                            </TableRow>
                                                        ) : (
                                                            paginatedTasks.map((task) => (
                                                                <TableRow key={task.id} hover>
                                                                    <TableCell>
                                                                        <Box>
                                                                            <Typography variant="body2" fontWeight={500}>{task.title}</Typography>
                                                                            {task.description && (
                                                                                <Typography variant="caption" color="text.secondary" sx={{ display: "block", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                                                    {task.description}
                                                                                </Typography>
                                                                            )}
                                                                        </Box>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Chip
                                                                            label={task.status === "IN_PROGRESS" ? "In Progress" : "To Do"}
                                                                            size="small"
                                                                            color={task.status === "IN_PROGRESS" ? "warning" : "default"}
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                                            <HourglassEmpty sx={{ fontSize: 16, color: "#1976d2" }} />
                                                                            <Typography variant="body2">{formatMinutes(task.estimatedMinutes || 0)}</Typography>
                                                                        </Box>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                                            <AccessTime sx={{ fontSize: 16, color: "#1976d2" }} />
                                                                            <Typography variant="body2">{formatMinutes(task.actualMinutes || 0)}</Typography>
                                                                        </Box>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Typography variant="body2" color="text.secondary">
                                                                            {task.updatedAt ? format(new Date(task.updatedAt), "MMM d, yyyy") : "-"}
                                                                        </Typography>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                            {inProgressTasks.length > pageSize && (
                                                <TablePagination
                                                    component="div"
                                                    count={inProgressTasks.length}
                                                    page={inProgressPage}
                                                    onPageChange={(_, page) => setInProgressPage(page)}
                                                    rowsPerPage={pageSize}
                                                    rowsPerPageOptions={[pageSize]}
                                                />
                                            )}
                                        </>
                                    )
                                })()}
                            </TabPanel>

                            {/* Completed Tab */}
                            <TabPanel value={taskTabValue} index={1}>
                                {(() => {
                                    const completedTasksList = individual.tasks.filter(t => t.status === "DONE")
                                    const paginatedTasks = completedTasksList.slice(completedPage * pageSize, (completedPage + 1) * pageSize)
                                    
                                    return (
                                        <>
                                            <TableContainer>
                                                <Table size="small">
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell sx={{ fontWeight: 600 }}>Task</TableCell>
                                                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                                            <TableCell sx={{ fontWeight: 600 }}>Estimated</TableCell>
                                                            <TableCell sx={{ fontWeight: 600 }}>Actual</TableCell>
                                                            <TableCell sx={{ fontWeight: 600 }}>Completed</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {paginatedTasks.length === 0 ? (
                                                            <TableRow>
                                                                <TableCell colSpan={5} sx={{ textAlign: "center", py: 4 }}>
                                                                    <Typography color="text.secondary">No completed tasks</Typography>
                                                                </TableCell>
                                                            </TableRow>
                                                        ) : (
                                                            paginatedTasks.map((task) => (
                                                                <TableRow key={task.id} hover>
                                                                    <TableCell>
                                                                        <Box>
                                                                            <Typography variant="body2" fontWeight={500}>{task.title}</Typography>
                                                                            {task.description && (
                                                                                <Typography variant="caption" color="text.secondary" sx={{ display: "block", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                                                    {task.description}
                                                                                </Typography>
                                                                            )}
                                                                        </Box>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Chip label="Completed" size="small" color="success" />
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                                            <HourglassEmpty sx={{ fontSize: 16, color: "#1976d2" }} />
                                                                            <Typography variant="body2">{formatMinutes(task.estimatedMinutes || 0)}</Typography>
                                                                        </Box>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                                            <AccessTime sx={{ fontSize: 16, color: "#1976d2" }} />
                                                                            <Typography variant="body2">{formatMinutes(task.actualMinutes || 0)}</Typography>
                                                                        </Box>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Typography variant="body2" color="text.secondary">
                                                                            {task.completedAt ? format(new Date(task.completedAt), "MMM d, yyyy") : "-"}
                                                                        </Typography>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                            {completedTasksList.length > pageSize && (
                                                <TablePagination
                                                    component="div"
                                                    count={completedTasksList.length}
                                                    page={completedPage}
                                                    onPageChange={(_, page) => setCompletedPage(page)}
                                                    rowsPerPage={pageSize}
                                                    rowsPerPageOptions={[pageSize]}
                                                />
                                            )}
                                        </>
                                    )
                                })()}
                            </TabPanel>
                        </CardContent>
                    </Card>

                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 3 }}>
                        {/* Feedback History */}
                        <Card sx={{ borderRadius: 0 }}>
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
                                            borderRadius: 0,
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
