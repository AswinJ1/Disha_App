"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSession, signOut } from "next-auth/react"
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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
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
import {
    Download,
    Dashboard,
    Analytics as AnalyticsIcon,
    Notifications,
    Logout,
    Menu,
    Home,
    DarkMode,
    LightMode,
} from "@mui/icons-material"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
} from "recharts"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns"
import Link from "next/link"
import { useThemeMode } from "@/theme/ThemeContext"

interface Task {
    id: string
    title: string
    date: string
    completed: boolean
    status: string
}

const drawerWidth = 260

export default function IndividualAnalytics() {
    const muiTheme = useMuiTheme()
    const { mode, toggleTheme } = useThemeMode()
    const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"))
    const { data: session } = useSession()
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [timeRange, setTimeRange] = useState("week")
    const [drawerOpen, setDrawerOpen] = useState(!isMobile)
    const chartRef = useRef<HTMLDivElement>(null)

    const fetchTasks = useCallback(async () => {
        try {
            const res = await fetch("/api/tasks")
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

    useEffect(() => {
        fetchTasks()
    }, [fetchTasks])

    useEffect(() => {
        setDrawerOpen(!isMobile)
    }, [isMobile])

    const getDaysData = () => {
        const days = timeRange === "week" ? 7 : 30
        return Array.from({ length: days }, (_, i) => {
            const date = subDays(new Date(), days - 1 - i)
            const dayTasks = tasks.filter(
                (t) => format(new Date(t.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
            )
            return {
                date: format(date, timeRange === "week" ? "EEE" : "MMM d"),
                completed: dayTasks.filter((t) => t.completed || t.status === "DONE").length,
                pending: dayTasks.filter((t) => !t.completed && t.status !== "DONE").length,
                total: dayTasks.length,
            }
        })
    }

    const getPieData = () => {
        const completed = tasks.filter((t) => t.completed || t.status === "DONE").length
        const pending = tasks.filter((t) => !t.completed && t.status !== "DONE").length
        return [
            { name: "Completed", value: completed },
            { name: "Pending", value: pending },
        ]
    }

    const getWeeklyProgress = () => {
        const weeks: { week: string; rate: number }[] = []
        for (let i = 3; i >= 0; i--) {
            const weekStart = startOfWeek(subDays(new Date(), i * 7))
            const weekEnd = endOfWeek(subDays(new Date(), i * 7))

            const weekTasks = tasks.filter((t) => {
                const taskDate = new Date(t.date)
                return taskDate >= weekStart && taskDate <= weekEnd
            })

            const completed = weekTasks.filter((t) => t.completed || t.status === "DONE").length
            const total = weekTasks.length

            weeks.push({
                week: `Week ${4 - i}`,
                rate: total > 0 ? Math.round((completed / total) * 100) : 0,
            })
        }
        return weeks
    }

    const handleDownload = async (type: "png" | "pdf") => {
        if (!chartRef.current) return

        const canvas = await html2canvas(chartRef.current, {
            backgroundColor: mode === "light" ? "#ffffff" : "#1a1a1a",
            scale: 2,
        })

        if (type === "png") {
            const link = document.createElement("a")
            link.download = `activity-report-${format(new Date(), "yyyy-MM-dd")}.png`
            link.href = canvas.toDataURL()
            link.click()
        } else {
            const imgData = canvas.toDataURL("image/png")
            const pdf = new jsPDF("l", "mm", "a4")
            const pdfWidth = pdf.internal.pageSize.getWidth()
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width
            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
            pdf.save(`activity-report-${format(new Date(), "yyyy-MM-dd")}.pdf`)
        }
    }

    const dailyData = getDaysData()
    const pieData = getPieData()
    const weeklyProgress = getWeeklyProgress()
    const totalCompleted = tasks.filter((t) => t.completed || t.status === "DONE").length
    const totalPending = tasks.filter((t) => !t.completed && t.status !== "DONE").length

    const COLORS = [muiTheme.palette.success.main, muiTheme.palette.warning.main]

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
                    <ListItemButton component={Link} href="/individual" sx={{ borderRadius: 2 }}>
                        <ListItemIcon><Home /></ListItemIcon>
                        <ListItemText primary="Kanban Board" />
                    </ListItemButton>
                    <ListItemButton selected sx={{ borderRadius: 2 }}>
                        <ListItemIcon><AnalyticsIcon sx={{ color: "primary.main" }} /></ListItemIcon>
                        <ListItemText primary="Analytics" />
                    </ListItemButton>
                </List>
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
                    <AnalyticsIcon sx={{ mr: 1, color: "primary.main" }} />
                    <Typography variant="h6" fontWeight={600} sx={{ flexGrow: 1 }}>
                        Analytics
                    </Typography>
                    <Badge badgeContent={3} color="error" sx={{ mr: 2 }}>
                        <IconButton color="inherit">
                            <Notifications />
                        </IconButton>
                    </Badge>
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
                    p: 3,
                    width: { md: `calc(100% - ${drawerOpen ? drawerWidth : 0}px)` },
                    ml: { md: drawerOpen ? 0 : `-${drawerWidth}px` },
                    transition: "margin 0.3s, width 0.3s",
                }}
            >
                <Toolbar />
                <Container maxWidth="xl" disableGutters>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
                        <Typography variant="h4" fontWeight={700}>
                            Activity Analytics
                        </Typography>
                        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel>Time Range</InputLabel>
                                <Select
                                    value={timeRange}
                                    label="Time Range"
                                    onChange={(e) => setTimeRange(e.target.value)}
                                >
                                    <MenuItem value="week">Last 7 Days</MenuItem>
                                    <MenuItem value="month">Last 30 Days</MenuItem>
                                </Select>
                            </FormControl>
                            <Button variant="outlined" startIcon={<Download />} onClick={() => handleDownload("png")}>
                                PNG
                            </Button>
                            <Button variant="contained" startIcon={<Download />} onClick={() => handleDownload("pdf")}>
                                PDF
                            </Button>
                        </Box>
                    </Box>

                    <Box ref={chartRef} sx={{ p: 2, bgcolor: "background.paper", borderRadius: 2 }}>
                        {/* Stats Cards */}
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2, mb: 3 }}>
                            <Card>
                                <CardContent>
                                    <Typography color="text.secondary" variant="body2">Total Tasks</Typography>
                                    <Typography variant="h3" fontWeight={700}>{tasks.length}</Typography>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent>
                                    <Typography color="text.secondary" variant="body2">Completed</Typography>
                                    <Typography variant="h3" fontWeight={700} color="success.main">{totalCompleted}</Typography>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent>
                                    <Typography color="text.secondary" variant="body2">Pending</Typography>
                                    <Typography variant="h3" fontWeight={700} color="warning.main">{totalPending}</Typography>
                                </CardContent>
                            </Card>
                        </Box>

                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" }, gap: 2, mb: 3 }}>
                            {/* Daily Activity Chart */}
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" fontWeight={600} gutterBottom>
                                        Daily Activity
                                    </Typography>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={dailyData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={muiTheme.palette.divider} />
                                            <XAxis dataKey="date" stroke={muiTheme.palette.text.secondary} />
                                            <YAxis stroke={muiTheme.palette.text.secondary} />
                                            <Tooltip contentStyle={{ background: muiTheme.palette.background.paper, border: `1px solid ${muiTheme.palette.divider}` }} />
                                            <Legend />
                                            <Bar dataKey="completed" name="Completed" fill={muiTheme.palette.success.main} radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="pending" name="Pending" fill={muiTheme.palette.warning.main} radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Completion Pie Chart */}
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" fontWeight={600} gutterBottom>
                                        Completion Rate
                                    </Typography>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ background: muiTheme.palette.background.paper, border: `1px solid ${muiTheme.palette.divider}` }} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </Box>

                        {/* Weekly Progress Line Chart */}
                        <Card>
                            <CardContent>
                                <Typography variant="h6" fontWeight={600} gutterBottom>
                                    Weekly Completion Rate Trend
                                </Typography>
                                <ResponsiveContainer width="100%" height={200}>
                                    <LineChart data={weeklyProgress}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={muiTheme.palette.divider} />
                                        <XAxis dataKey="week" stroke={muiTheme.palette.text.secondary} />
                                        <YAxis stroke={muiTheme.palette.text.secondary} unit="%" />
                                        <Tooltip contentStyle={{ background: muiTheme.palette.background.paper, border: `1px solid ${muiTheme.palette.divider}` }} />
                                        <Legend />
                                        <Line type="monotone" dataKey="rate" name="Completion Rate" stroke={muiTheme.palette.primary.main} strokeWidth={3} dot={{ fill: muiTheme.palette.primary.main }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </Box>
                </Container>
            </Box>
        </Box>
    )
}
