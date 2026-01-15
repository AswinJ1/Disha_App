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
    Divider,
    Badge,
    LinearProgress,
    useMediaQuery,
    useTheme as useMuiTheme,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Tabs,
    Tab,
} from "@mui/material"
import {
    EmojiEvents,
    Notifications,
    Logout,
    Menu,
    Home,
    DarkMode,
    LightMode,
    SmartToy,
    Leaderboard as LeaderboardIcon,
    AccessTime,
    HourglassEmpty,
    CheckCircle,
    PendingActions,
    TrendingUp,
    WorkspacePremium,
    Analytics,
    ViewKanban,
    TableChart,
    Public,
    Groups,
} from "@mui/icons-material"
import Link from "next/link"
import { useThemeMode } from "@/theme/ThemeContext"

interface LeaderboardEntry {
    id: string
    name: string
    completedTasks: number
    pendingTasks: number
    totalTasks: number
    actualMinutes: number
    estimatedMinutes: number
    efficiency: number
    compositeScore: number
    rank: number
}

const drawerWidth = 260

function formatMinutes(minutes: number): string {
    if (minutes === 0) return "0m"
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

function getRankIcon(rank: number) {
    if (rank === 1) return <WorkspacePremium sx={{ color: "#FFD700", fontSize: 28 }} />
    if (rank === 2) return <WorkspacePremium sx={{ color: "#C0C0C0", fontSize: 26 }} />
    if (rank === 3) return <WorkspacePremium sx={{ color: "#CD7F32", fontSize: 24 }} />
    return null
}

function getRankColor(rank: number) {
    if (rank === 1) return "#FFD700"
    if (rank === 2) return "#C0C0C0"
    if (rank === 3) return "#CD7F32"
    return "text.secondary"
}

export default function IndividualLeaderboardPage() {
    const muiTheme = useMuiTheme()
    const { mode, toggleTheme } = useThemeMode()
    const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"))
    const { data: session } = useSession()
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [drawerOpen, setDrawerOpen] = useState(!isMobile)
    const [lastUpdated, setLastUpdated] = useState<string | null>(null)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [tabValue, setTabValue] = useState(0) // 0 = Learning Group (default), 1 = Global

    const fetchLeaderboard = useCallback(async (scope: "group" | "global" = "group") => {
        try {
            setLoading(true)
            const res = await fetch(`/api/individual/leaderboard?scope=${scope}`)
            if (res.ok) {
                const data = await res.json()
                setLeaderboard(data.leaderboard)
                setLastUpdated(data.lastUpdated)
                setCurrentUserId(data.currentUserId)
            }
        } catch (error) {
            console.error("Failed to fetch leaderboard:", error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        const scope = tabValue === 0 ? "group" : "global"
        fetchLeaderboard(scope)
        // Auto-refresh every 30 seconds
        const interval = setInterval(() => fetchLeaderboard(scope), 30000)
        return () => clearInterval(interval)
    }, [fetchLeaderboard, tabValue])

    useEffect(() => {
        setDrawerOpen(!isMobile)
    }, [isMobile])

    // Find current user's rank
    const currentUserEntry = leaderboard.find(e => e.id === currentUserId)

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
                        <ListItemIcon><ViewKanban /></ListItemIcon>
                        <ListItemText primary="Task Board" />
                    </ListItemButton>
                    <ListItemButton component={Link} href="/individual/tasks" sx={{ borderRadius: 0 }}>
                        <ListItemIcon><TableChart /></ListItemIcon>
                        <ListItemText primary="Tasks Table" />
                    </ListItemButton>
                    <ListItemButton selected sx={{ borderRadius: 0 }}>
                        <ListItemIcon><LeaderboardIcon sx={{ color: "primary.main" }} /></ListItemIcon>
                        <ListItemText primary="Leaderboard" />
                    </ListItemButton>
                    <ListItemButton component={Link} href="/individual/analytics" sx={{ borderRadius: 0 }}>
                        <ListItemIcon><Analytics /></ListItemIcon>
                        <ListItemText primary="Analytics" />
                    </ListItemButton>
                    <ListItemButton component={Link} href="/individual/ai-assistant" sx={{ borderRadius: 0 }}>
                        <ListItemIcon><SmartToy /></ListItemIcon>
                        <ListItemText primary="AI Assistant" />
                    </ListItemButton>
                </List>

                <Divider sx={{ my: 2 }} />

                {currentUserEntry && (
                    <>
                        <Typography variant="caption" color="text.secondary" sx={{ px: 2, fontWeight: 600, textTransform: "uppercase" }}>
                            Your Rank
                        </Typography>
                        <Box sx={{ px: 2, mt: 1 }}>
                            <Typography variant="h4" fontWeight={700} sx={{ color: getRankColor(currentUserEntry.rank) }}>
                                #{currentUserEntry.rank}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                of {leaderboard.length} individuals
                            </Typography>
                        </Box>
                    </>
                )}
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
                    <EmojiEvents sx={{ mr: 1, color: "#FFD700" }} />
                    <Typography variant="h6" fontWeight={600} sx={{ flexGrow: 1 }}>
                        Leaderboard
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
                    {/* Header */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h5" fontWeight={700} gutterBottom>
                            <EmojiEvents sx={{ mr: 1, verticalAlign: "middle", color: "#FFD700" }} />
                            {tabValue === 0 ? "Learning Group Rankings" : "Global Rankings"}
                        </Typography>
                        {lastUpdated && (
                            <Typography variant="caption" color="text.secondary">
                                Last updated: {new Date(lastUpdated).toLocaleString()}
                            </Typography>
                        )}
                    </Box>

                    {/* Tabs for Global / Learning Group */}
                    <Card sx={{ mb: 3, borderRadius: 0 }}>
                        <Tabs
                            value={tabValue}
                            onChange={(_, newValue) => setTabValue(newValue)}
                            sx={{
                                "& .MuiTab-root": {
                                    textTransform: "none",
                                    fontWeight: 600,
                                    minHeight: 56,
                                },
                            }}
                        >
                            <Tab
                                icon={<Groups sx={{ color: tabValue === 0 ? "#1976d2" : undefined }} />}
                                iconPosition="start"
                                label="Learning Group"
                            />
                            <Tab
                                icon={<Public sx={{ color: tabValue === 1 ? "#1976d2" : undefined }} />}
                                iconPosition="start"
                                label="Global"
                            />
                        </Tabs>
                    </Card>

                    {/* Current User Highlight */}
                    {currentUserEntry && (
                        <Card sx={{ mb: 3, borderRadius: 0, border: currentUserEntry.rank <= 3 ? `2px solid ${getRankColor(currentUserEntry.rank)}` : undefined }}>
                            <CardContent>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        {getRankIcon(currentUserEntry.rank)}
                                        <Typography variant="h4" fontWeight={700} sx={{ color: getRankColor(currentUserEntry.rank) }}>
                                            #{currentUserEntry.rank}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="h6" fontWeight={600}>
                                            Your Current Standing {tabValue === 1 && "(Global)"}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {currentUserEntry.completedTasks} tasks completed • {currentUserEntry.pendingTasks} pending • Score: {currentUserEntry.compositeScore}
                                        </Typography>
                                    </Box>
                                    <Chip 
                                        label={`Efficiency: ${currentUserEntry.efficiency}%`}
                                        variant="outlined"
                                        color={currentUserEntry.efficiency >= 100 ? "success" : currentUserEntry.efficiency >= 75 ? "warning" : "error"}
                                    />
                                </Box>
                            </CardContent>
                        </Card>
                    )}

                    {/* Full Leaderboard Table */}
                    <Card sx={{ borderRadius: 0 }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                <TrendingUp sx={{ mr: 1, verticalAlign: "middle", color: "#1976d2" }} />
                                Full Rankings
                            </Typography>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 600 }}>Rank</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Individual</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }} align="center">
                                                {/* <CheckCircle sx={{ fontSize: 16, mr: 0.5, verticalAlign: "middle", color: "#1976d2" }} /> */}
                                                Completed
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 600 }} align="center">
                                                {/* <PendingActions sx={{ fontSize: 16, mr: 0.5, verticalAlign: "middle", color: "#1976d2" }} /> */}
                                                Pending
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 600 }} align="center">
                                                {/* <HourglassEmpty sx={{ fontSize: 16, mr: 0.5, verticalAlign: "middle", color: "#1976d2" }} /> */}
                                                Estimated
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 600 }} align="center">
                                                {/* <AccessTime sx={{ fontSize: 16, mr: 0.5, verticalAlign: "middle", color: "#1976d2" }} /> */}
                                                Actual
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 600 }} align="center">Efficiency</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }} align="center">Score</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {leaderboard.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} sx={{ textAlign: "center", py: 4 }}>
                                                    <Typography color="text.secondary">
                                                        {tabValue === 0 
                                                            ? "You can see the rankings once mentor adds you to a learning group." 
                                                            : "No individuals found on the platform"}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            leaderboard.map((entry) => (
                                                <TableRow 
                                                    key={entry.id} 
                                                    hover
                                                    sx={{
                                                        bgcolor: entry.id === currentUserId 
                                                            ? "action.selected" 
                                                            : entry.rank <= 3 
                                                                ? `${getRankColor(entry.rank)}10` 
                                                                : "transparent",
                                                    }}
                                                >
                                                    <TableCell>
                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                            {getRankIcon(entry.rank)}
                                                            <Typography 
                                                                variant="body1" 
                                                                fontWeight={entry.rank <= 3 || entry.id === currentUserId ? 700 : 500}
                                                                sx={{ color: getRankColor(entry.rank) }}
                                                            >
                                                                #{entry.rank}
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                                            <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36 }}>
                                                                {entry.name[0]?.toUpperCase()}
                                                            </Avatar>
                                                            <Box>
                                                                <Typography 
                                                                    variant="body2" 
                                                                    fontWeight={600}
                                                                >
                                                                    {entry.name} {entry.id === currentUserId && <Chip label="You" size="small" color="primary" sx={{ ml: 1, height: 20 }} />}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        {entry.completedTasks} 
                                                         
                                                    </TableCell>
                                                    <TableCell align="center">
                                                       {entry.pendingTasks} 
                                                         
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Typography variant="body2">
                                                            {formatMinutes(entry.estimatedMinutes)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Typography variant="body2">
                                                            {formatMinutes(entry.actualMinutes)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                      
                                                        {entry.efficiency}%
                                                           
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Typography 
                                                            variant="body2" 
                                                            fontWeight={700}
                                                            color={entry.rank <= 3 ? getRankColor(entry.rank) : "text.primary"}
                                                        >
                                                            {entry.compositeScore}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>

                    {/* Scoring Explanation */}
                    <Card sx={{ mt: 3, borderRadius: 0 }}>
                        <CardContent>
                            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                How Scores are Calculated
                            </Typography>
                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>Completed Tasks (40%)</strong>
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        More completed tasks = higher score
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>Time Efficiency (35%)</strong>
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Actual time ≤ Estimated time = higher efficiency
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>Pending Tasks (25%)</strong>
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Fewer pending tasks = higher score
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Container>
            </Box>
        </Box>
    )
}