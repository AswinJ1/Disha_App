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
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    Badge,
    Chip,
    LinearProgress,
    Alert,
    Snackbar,
    useMediaQuery,
    useTheme as useMuiTheme,
} from "@mui/material"
import {
    Dashboard,
    People,
    Analytics,
    Notifications,
    Logout,
    Menu,
    CheckCircle,
    TrendingUp,
    Person,
    Home,
    DarkMode,
    LightMode,
    PersonAdd,
    Email,
    Close,
    SmartToy,
    Message,
} from "@mui/icons-material"
import Link from "next/link"
import { useThemeMode } from "@/theme/ThemeContext"
import { format } from "date-fns"

interface Individual {
    id: string
    name: string
    email: string
    _count: {
        tasks: number
    }
    completedTasks: number
    totalTasks: number
}

interface Notification {
    id: string
    message: string
    type: string
    read: boolean
    createdAt: string
}

const drawerWidth = 260
const notificationsWidth = 350

export default function CounselorDashboard() {
    const muiTheme = useMuiTheme()
    const { mode, toggleTheme } = useThemeMode()
    const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"))
    const { data: session } = useSession()
    const [individuals, setIndividuals] = useState<Individual[]>([])
    const [loading, setLoading] = useState(true)
    const [drawerOpen, setDrawerOpen] = useState(!isMobile)
    const [addDialogOpen, setAddDialogOpen] = useState(false)
    const [individualEmail, setIndividualEmail] = useState("")
    const [addingIndividual, setAddingIndividual] = useState(false)
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" })
    const [stats, setStats] = useState({
        totalIndividuals: 0,
        totalTasksCompleted: 0,
        averageCompletion: 0,
    })
    const [notificationsOpen, setNotificationsOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)

    const fetchIndividuals = useCallback(async () => {
        try {
            const res = await fetch("/api/counselor/individuals")
            if (res.ok) {
                const data = await res.json()
                setIndividuals(data.individuals)
                setStats({
                    totalIndividuals: data.individuals.length,
                    totalTasksCompleted: data.totalCompleted,
                    averageCompletion: data.averageCompletion,
                })
            }
        } catch (error) {
            console.error("Failed to fetch individuals:", error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchIndividuals()
    }, [fetchIndividuals])

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
        fetchNotifications()
    }, [fetchNotifications])

    const handleOpenNotifications = () => {
        setNotificationsOpen(true)
        if (unreadCount > 0) {
            markNotificationsRead()
        }
    }

    useEffect(() => {
        setDrawerOpen(!isMobile)
    }, [isMobile])

    const handleAddIndividual = async () => {
        if (!individualEmail.trim()) return

        setAddingIndividual(true)
        try {
            const res = await fetch("/api/counselor/add-individual", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: individualEmail }),
            })

            const data = await res.json()

            if (res.ok) {
                setSnackbar({ open: true, message: `Successfully added ${data.name}!`, severity: "success" })
                setAddDialogOpen(false)
                setIndividualEmail("")
                fetchIndividuals()
            } else {
                setSnackbar({ open: true, message: data.error || "Failed to add individual", severity: "error" })
            }
        } catch (error) {
            console.error("Failed to add individual:", error)
            setSnackbar({ open: true, message: "Network error. Please try again.", severity: "error" })
        } finally {
            setAddingIndividual(false)
        }
    }

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
                    <ListItemButton selected>
                        <ListItemIcon><Home sx={{ color: "primary.main" }} /></ListItemIcon>
                        <ListItemText primary="Dashboard" />
                    </ListItemButton>
                    <ListItemButton>
                        <ListItemIcon><People /></ListItemIcon>
                        <ListItemText primary="Individuals" />
                    </ListItemButton>
                    <ListItemButton>
                        <ListItemIcon><Analytics /></ListItemIcon>
                        <ListItemText primary="Reports" />
                    </ListItemButton>
                    <ListItemButton component={Link} href="/counselor/ai-assistant">
                        <ListItemIcon><SmartToy /></ListItemIcon>
                        <ListItemText primary="AI Assistant" />
                    </ListItemButton>
                </List>

                <Divider sx={{ my: 2 }} />

                <Typography variant="caption" color="text.secondary" sx={{ px: 2, fontWeight: 600, textTransform: "uppercase" }}>
                    Quick Stats
                </Typography>
                <Box sx={{ px: 2, mt: 1 }}>
                    <Typography variant="h4" fontWeight={700} color="primary.main">
                        {stats.totalIndividuals}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Total Individuals
                    </Typography>
                </Box>
                <Box sx={{ px: 2, mt: 2 }}>
                    <Typography variant="h4" fontWeight={700} color="success.main">
                        {stats.averageCompletion}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Avg Completion
                    </Typography>
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
                    <Dashboard sx={{ mr: 1, color: "secondary.main" }} />
                    <Typography variant="h6" fontWeight={600} sx={{ flexGrow: 1 }}>
                        Counselor Dashboard
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
                        Notifications
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
                                Updates about your individuals will appear here
                            </Typography>
                        </Box>
                    ) : (
                        notifications.map((notification) => (
                            <Card
                                key={notification.id}
                                sx={{
                                    mb: 2,
                                    bgcolor: notification.read ? "background.paper" : "action.hover",
                                    borderLeft: "3px solid",
                                    borderColor: notification.type === "TASK_COMPLETED" ? "success.main" : "primary.main",
                                }}
                            >
                                <CardContent sx={{ py: 1.5 }}>
                                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                                        <CheckCircle color="success" fontSize="small" />
                                        <Box sx={{ flex: 1 }}>
                                            <Chip
                                                label={notification.type === "TASK_COMPLETED" ? "Task Completed" : notification.type}
                                                size="small"
                                                color={notification.type === "TASK_COMPLETED" ? "success" : "primary"}
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
                    {/* Header */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
                        <Box>
                            <Typography variant="h4" fontWeight={700} gutterBottom>
                                Overview
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Monitor your individuals' progress and activities
                            </Typography>
                        </Box>
                        <Button
                            variant="contained"
                            startIcon={<PersonAdd />}
                            onClick={() => setAddDialogOpen(true)}
                        >
                            Add Individual
                        </Button>
                    </Box>

                    {/* Stats Cards */}
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
                            gap: 2,
                            mb: 4,
                        }}
                    >
                        <Card>
                            <CardContent>
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <Box>
                                        <Typography color="text.secondary" variant="body2">Total Individuals</Typography>
                                        <Typography variant="h3" fontWeight={700}>{stats.totalIndividuals}</Typography>
                                    </Box>
                                    <Avatar sx={{ bgcolor: "primary.light", width: 48, height: 48 }}>
                                        <People sx={{ color: "primary.main" }} />
                                    </Avatar>
                                </Box>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <Box>
                                        <Typography color="text.secondary" variant="body2">Tasks Completed</Typography>
                                        <Typography variant="h3" fontWeight={700}>{stats.totalTasksCompleted}</Typography>
                                    </Box>
                                    <Avatar sx={{ bgcolor: "success.light", width: 48, height: 48 }}>
                                        <CheckCircle sx={{ color: "success.main" }} />
                                    </Avatar>
                                </Box>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <Box>
                                        <Typography color="text.secondary" variant="body2">Avg. Completion Rate</Typography>
                                        <Typography variant="h3" fontWeight={700}>{stats.averageCompletion}%</Typography>
                                    </Box>
                                    <Avatar sx={{ bgcolor: "warning.light", width: 48, height: 48 }}>
                                        <TrendingUp sx={{ color: "warning.main" }} />
                                    </Avatar>
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>

                    {/* Individuals List */}
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                        My Individuals
                    </Typography>

                    {loading ? (
                        <LinearProgress />
                    ) : individuals.length === 0 ? (
                        <Card sx={{ textAlign: "center", py: 6 }}>
                            <CardContent>
                                <Person sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
                                <Typography variant="h6" color="text.secondary" gutterBottom>
                                    No individuals assigned yet
                                </Typography>
                                <Typography color="text.secondary" sx={{ mb: 2 }}>
                                    Add individuals by their email address to start tracking their progress
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<PersonAdd />}
                                    onClick={() => setAddDialogOpen(true)}
                                >
                                    Add First Individual
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }, gap: 2 }}>
                            {individuals.map((individual) => (
                                <Card
                                    key={individual.id}
                                    component={Link}
                                    href={`/counselor/individual/${individual.id}`}
                                    sx={{
                                        textDecoration: "none",
                                        transition: "all 0.2s ease",
                                        "&:hover": {
                                            transform: "translateY(-2px)",
                                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                        },
                                    }}
                                >
                                    <CardContent>
                                        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                            <Avatar sx={{ bgcolor: "primary.main", mr: 2 }}>
                                                {individual.name[0].toUpperCase()}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle1" fontWeight={600}>
                                                    {individual.name}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {individual.email}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Divider sx={{ my: 1.5 }} />
                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">Tasks</Typography>
                                                <Typography variant="body2" fontWeight={600}>{individual.totalTasks}</Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">Done</Typography>
                                                <Typography variant="body2" fontWeight={600} color="success.main">{individual.completedTasks}</Typography>
                                            </Box>
                                            <Chip
                                                label={`${individual.totalTasks > 0 ? Math.round((individual.completedTasks / individual.totalTasks) * 100) : 0}%`}
                                                color={individual.completedTasks / individual.totalTasks >= 0.7 ? "success" : "warning"}
                                                size="small"
                                            />
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={individual.totalTasks > 0 ? (individual.completedTasks / individual.totalTasks) * 100 : 0}
                                            sx={{ mt: 1.5, height: 4, borderRadius: 2 }}
                                        />
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                    )}
                </Container>
            </Box>

            {/* Add Individual Dialog */}
            <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <PersonAdd color="primary" />
                        Add Individual
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography color="text.secondary" sx={{ mb: 3 }}>
                        Enter the email address of the individual you want to add. They must already have an account registered as an Individual.
                    </Typography>
                    <TextField
                        autoFocus
                        fullWidth
                        label="Individual's Email"
                        type="email"
                        value={individualEmail}
                        onChange={(e) => setIndividualEmail(e.target.value)}
                        placeholder="example@email.com"
                        InputProps={{
                            startAdornment: <Email color="action" sx={{ mr: 1 }} />,
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleAddIndividual}
                        disabled={addingIndividual || !individualEmail.trim()}
                    >
                        {addingIndividual ? "Adding..." : "Add Individual"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
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
