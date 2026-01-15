"use client"

import { useState, useEffect, useCallback } from "react"
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
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Badge,
    useMediaQuery,
    useTheme as useMuiTheme,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Paper,
    Chip,
    CircularProgress,
    Skeleton,
} from "@mui/material"
import {
    Analytics as AnalyticsIcon,
    Notifications,
    Logout,
    Menu,
    Home,
    DarkMode,
    LightMode,
    SmartToy,
    TableChart,
    AccessTime,
    CheckCircle,
    HourglassEmpty,
    Leaderboard,
} from "@mui/icons-material"
import { format } from "date-fns"
import Link from "next/link"
import { useThemeMode } from "@/theme/ThemeContext"

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
    updatedAt: string
    createdAt: string
}

interface PaginatedResponse {
    tasks: Task[]
    total: number
    page: number
    pageSize: number
    totalPages: number
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

export default function TasksTableView() {
    const muiTheme = useMuiTheme()
    const { mode, toggleTheme } = useThemeMode()
    const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"))
    const { data: session } = useSession()
    
    const [drawerOpen, setDrawerOpen] = useState(!isMobile)
    const [tabValue, setTabValue] = useState(0)
    const [loading, setLoading] = useState(true)
    
    // Pagination state for In Progress
    const [inProgressTasks, setInProgressTasks] = useState<Task[]>([])
    const [inProgressTotal, setInProgressTotal] = useState(0)
    const [inProgressPage, setInProgressPage] = useState(0)
    
    // Pagination state for Completed
    const [completedTasks, setCompletedTasks] = useState<Task[]>([])
    const [completedTotal, setCompletedTotal] = useState(0)
    const [completedPage, setCompletedPage] = useState(0)
    
    const pageSize = 10

    // Fetch tasks based on status and pagination
    const fetchTasks = useCallback(async (status: "in_progress" | "completed", page: number) => {
        try {
            setLoading(true)
            const res = await fetch(`/api/tasks?status=${status}&page=${page + 1}&pageSize=${pageSize}`)
            if (res.ok) {
                const data: PaginatedResponse = await res.json()
                if (status === "in_progress") {
                    setInProgressTasks(data.tasks)
                    setInProgressTotal(data.total)
                } else {
                    setCompletedTasks(data.tasks)
                    setCompletedTotal(data.total)
                }
            }
        } catch (error) {
            console.error("Failed to fetch tasks:", error)
        } finally {
            setLoading(false)
        }
    }, [])

    // Fetch all tasks initially (fallback approach using existing API)
    const fetchAllTasks = useCallback(async () => {
        try {
            setLoading(true)
            const res = await fetch("/api/tasks")
            if (res.ok) {
                const data: Task[] = await res.json()
                
                // Filter in-progress tasks (TODO, IN_PROGRESS)
                const inProgress = data.filter(t => t.status === "TODO" || t.status === "IN_PROGRESS")
                const completed = data.filter(t => t.status === "DONE")
                
                // Sort by updatedAt descending
                inProgress.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
                completed.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
                
                setInProgressTasks(inProgress.slice(inProgressPage * pageSize, (inProgressPage + 1) * pageSize))
                setInProgressTotal(inProgress.length)
                
                setCompletedTasks(completed.slice(completedPage * pageSize, (completedPage + 1) * pageSize))
                setCompletedTotal(completed.length)
            }
        } catch (error) {
            console.error("Failed to fetch tasks:", error)
        } finally {
            setLoading(false)
        }
    }, [inProgressPage, completedPage])

    useEffect(() => {
        fetchAllTasks()
    }, [fetchAllTasks])

    useEffect(() => {
        setDrawerOpen(!isMobile)
    }, [isMobile])

    // Handle tab change - reset pagination
    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue)
        // Reset page numbers when switching tabs
        if (newValue === 0) {
            setInProgressPage(0)
        } else {
            setCompletedPage(0)
        }
    }

    // Handle page change for In Progress
    const handleInProgressPageChange = (_event: unknown, newPage: number) => {
        setInProgressPage(newPage)
    }

    // Handle page change for Completed
    const handleCompletedPageChange = (_event: unknown, newPage: number) => {
        setCompletedPage(newPage)
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
                    <ListItemButton component={Link} href="/individual" sx={{ borderRadius: 0 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}><Home sx={{ color: "primary.main" }} /></ListItemIcon>
                        <ListItemText primary="Kanban Board" />
                    </ListItemButton>
                    <ListItemButton selected sx={{ borderRadius: 0 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}><TableChart sx={{ color: "primary.main" }} /></ListItemIcon>
                        <ListItemText primary="Tasks Table" />
                    </ListItemButton>
                    <ListItemButton component={Link} href="/individual/leaderboard" sx={{ borderRadius: 0 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}><Leaderboard /></ListItemIcon>
                        <ListItemText primary="Leaderboard" />
                    </ListItemButton>
                    <ListItemButton component={Link} href="/individual/analytics" sx={{ borderRadius: 0 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}><AnalyticsIcon sx={{ color: "primary.main" }} /></ListItemIcon>
                        <ListItemText primary="Analytics" />
                    </ListItemButton>
                    <ListItemButton component={Link} href="/individual/ai-assistant" sx={{ borderRadius: 0 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}><SmartToy sx={{ color: "primary.main" }} /></ListItemIcon>
                        <ListItemText primary="AI Assistant" />
                    </ListItemButton>
                </List>
            </Box>
        </Box>
    )

    const renderTaskTable = (tasks: Task[], total: number, page: number, onPageChange: (event: unknown, newPage: number) => void) => (
        <Card sx={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid", borderColor: "divider", borderRadius: 0 }}>
            <TableContainer>
                <Table sx={{ minWidth: 650 }} aria-label="tasks table">
                    <TableHead>
                        <TableRow sx={{ bgcolor: "background.default" }}>
                            <TableCell sx={{ fontWeight: 600, py: 2 }}>Task Title</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600, py: 2, width: 140 }}>
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                                    {/* <HourglassEmpty fontSize="small" sx={{ color: "primary.main" }} /> */}
                                    Estimated Time
                                </Box>
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600, py: 2, width: 140 }}>
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                                    {/* <AccessTime fontSize="small" sx={{ color: "primary.main" }} /> */}
                                    Actual Time
                                </Box>
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, py: 2, width: 180 }}>Last Updated</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            // Loading skeleton
                            Array.from({ length: 5 }).map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell><Skeleton variant="text" width="80%" /></TableCell>
                                    <TableCell align="center"><Skeleton variant="text" width={60} sx={{ mx: "auto" }} /></TableCell>
                                    <TableCell align="center"><Skeleton variant="text" width={60} sx={{ mx: "auto" }} /></TableCell>
                                    <TableCell align="right"><Skeleton variant="text" width={120} sx={{ ml: "auto" }} /></TableCell>
                                </TableRow>
                            ))
                        ) : tasks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                                        {tabValue === 0 ? (
                                            <>
                                                <HourglassEmpty sx={{ fontSize: 48, color: "primary.main", opacity: 0.5 }} />
                                                <Typography variant="body1" color="text.secondary">
                                                    No tasks in progress
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Tasks that are in TODO or IN_PROGRESS status will appear here
                                                </Typography>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle sx={{ fontSize: 48, color: "primary.main", opacity: 0.5 }} />
                                                <Typography variant="body1" color="text.secondary">
                                                    No completed tasks yet
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Completed tasks will appear here for your review
                                                </Typography>
                                            </>
                                        )}
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : (
                            tasks.map((task) => (
                                <TableRow
                                    key={task.id}
                                    sx={{
                                        "&:hover": { bgcolor: "action.hover" },
                                        "&:last-child td, &:last-child th": { border: 0 },
                                    }}
                                >
                                    <TableCell>
                                        <Box>
                                            <Typography variant="body1" fontWeight={500}>
                                                {task.title}
                                            </Typography>
                                            {task.description && (
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }} noWrap>
                                                    {task.description.length > 60 ? `${task.description.substring(0, 60)}...` : task.description}
                                                </Typography>
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={formatMinutes(task.estimatedMinutes)}
                                            size="small"
                                            variant="outlined"
                                            sx={{ minWidth: 60 }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={formatMinutes(task.actualMinutes)}
                                            size="small"
                                            color={task.actualMinutes ? "primary" : "default"}
                                            variant={task.actualMinutes ? "filled" : "outlined"}
                                            sx={{ minWidth: 60 }}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="body2" color="text.secondary">
                                            {format(new Date(task.updatedAt || task.createdAt), "MMM d, yyyy h:mm a")}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                component="div"
                count={total}
                page={page}
                onPageChange={onPageChange}
                rowsPerPage={pageSize}
                rowsPerPageOptions={[pageSize]}
                sx={{
                    borderTop: "1px solid",
                    borderColor: "divider",
                    ".MuiTablePagination-displayedRows": {
                        fontWeight: 500,
                    },
                }}
            />
        </Card>
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
                    <TableChart sx={{ mr: 1, color: "primary.main" }} />
                    <Typography variant="h6" fontWeight={600} sx={{ flexGrow: 1 }}>
                        Tasks Overview
                    </Typography>
                    <Badge badgeContent={0} color="error" sx={{ mr: 2 }}>
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
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h4" fontWeight={700} gutterBottom>
                            Tasks Review
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Review your tasks in a table format. This view is read-only for reviewing task history and progress.
                        </Typography>
                    </Box>

                    {/* Summary Cards */}
                    <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
                        <Card sx={{ flex: "1 1 200px", minWidth: 200, borderRadius: 0 }}>
                            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                <Box
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 0,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <HourglassEmpty sx={{ color: "primary.dark" }} />
                                </Box>
                                <Box>
                                    <Typography variant="h4" fontWeight={700}>
                                        {inProgressTotal}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        In Progress
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                        <Card sx={{ flex: "1 1 200px", minWidth: 200, borderRadius: 0 }}>
                            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                <Box
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 0,                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <CheckCircle sx={{ color: "primary.dark" }} />
                                </Box>
                                <Box>
                                    <Typography variant="h4" fontWeight={700}>
                                        {completedTotal}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Completed
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>

                    {/* Tabs */}
                    <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 0 }}>
                        <Tabs
                            value={tabValue}
                            onChange={handleTabChange}
                            aria-label="task status tabs"
                            sx={{
                                "& .MuiTab-root": {
                                    fontWeight: 600,
                                    textTransform: "none",
                                    minHeight: 48,
                                },
                            }}
                        >
                            <Tab
                                icon={<HourglassEmpty sx={{ color: "primary.main" }} />}
                                iconPosition="start"
                                label={`In Progress (${inProgressTotal})`}
                                id="task-tab-0"
                                aria-controls="task-tabpanel-0"
                            />
                            <Tab
                                icon={<CheckCircle sx={{ color: "primary.main" }} />}
                                iconPosition="start"
                                label={`Completed (${completedTotal})`}
                                id="task-tab-1"
                                aria-controls="task-tabpanel-1"
                            />
                        </Tabs>
                    </Box>

                    {/* Tab Panels */}
                    <TabPanel value={tabValue} index={0}>
                        {renderTaskTable(inProgressTasks, inProgressTotal, inProgressPage, handleInProgressPageChange)}
                    </TabPanel>
                    <TabPanel value={tabValue} index={1}>
                        {renderTaskTable(completedTasks, completedTotal, completedPage, handleCompletedPageChange)}
                    </TabPanel>
                </Container>
            </Box>
        </Box>
    )
}
