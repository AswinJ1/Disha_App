"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
} from "@mui/material"
import {
  CalendarMonth,
  TrendingUp,
  Notifications,
  SupervisorAccount,
  Person,
  DarkMode,
  LightMode,
} from "@mui/icons-material"
import Link from "next/link"
import { useThemeMode } from "@/theme/ThemeContext"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { mode, toggleTheme } = useThemeMode()

  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user?.role === "COUNSELOR") {
        router.push("/counselor")
      } else {
        router.push("/individual")
      }
    }
  }, [session, status, router])

  if (status === "loading") {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <IconButton
        onClick={toggleTheme}
        sx={{ position: "absolute", top: 16, right: 16 }}
      >
        {mode === "light" ? <DarkMode /> : <LightMode />}
      </IconButton>

      <Container maxWidth="lg">
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            py: 8,
          }}
        >
          <Typography variant="h2" fontWeight={800} sx={{ mb: 2 }}>
            Counselor App
          </Typography>

          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ maxWidth: 600, mb: 4 }}
          >
            Track your daily routine with AI-powered motivation and professional
            counselor support. Build healthy habits, one task at a time.
          </Typography>

          <Box sx={{ display: "flex", gap: 2, mb: 8 }}>
            <Button
              component={Link}
              href="/login"
              variant="contained"
              size="large"
              sx={{ px: 4, py: 1.5 }}
            >
              Sign In
            </Button>
            <Button
              component={Link}
              href="/register"
              variant="outlined"
              size="large"
              sx={{ px: 4, py: 1.5 }}
            >
              Get Started
            </Button>
          </Box>

          {/* Features Grid */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
              gap: 3,
              width: "100%",
              maxWidth: 900,
            }}
          >
            <Card sx={{ textAlign: "center", py: 3 }}>
              <CardContent>
                <CalendarMonth sx={{ fontSize: 40, color: "primary.main", mb: 1 }} />
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Kanban Board
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Drag-and-drop task management with To Do, In Progress, and Done columns
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ textAlign: "center", py: 3 }}>
              <CardContent>
                <TrendingUp sx={{ fontSize: 40, color: "success.main", mb: 1 }} />
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Time Tracking
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Track estimated and actual time with built-in timer
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ textAlign: "center", py: 3 }}>
              <CardContent>
                <Notifications sx={{ fontSize: 40, color: "warning.main", mb: 1 }} />
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  AI Motivation
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Get AI-powered rewards and quotes to keep you motivated
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* User Types */}
          <Box sx={{ mt: 6, width: "100%", maxWidth: 700 }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Choose Your Role
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 2, mt: 2 }}>
              <Card>
                <CardContent sx={{ py: 3, textAlign: "center" }}>
                  <Person sx={{ fontSize: 40, color: "primary.main", mb: 1 }} />
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Individual
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Track routines, complete tasks, receive AI motivation and feedback
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent sx={{ py: 3, textAlign: "center" }}>
                  <SupervisorAccount sx={{ fontSize: 40, color: "secondary.main", mb: 1 }} />
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Counselor
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Monitor individuals, view activities, and provide feedback
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  )
}
