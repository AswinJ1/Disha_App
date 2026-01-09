"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Alert,
    Link as MuiLink,
    InputAdornment,
    IconButton,
    CircularProgress,
    Container,
} from "@mui/material"
import {
    Email,
    Lock,
    Visibility,
    VisibilityOff,
    DarkMode,
    LightMode,
} from "@mui/icons-material"
import Link from "next/link"
import { useThemeMode } from "@/theme/ThemeContext"

export default function LoginPage() {
    const router = useRouter()
    const { mode, toggleTheme } = useThemeMode()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            })

            if (result?.error) {
                setError("Invalid email or password")
                setLoading(false)
                return
            }

            router.push("/individual")
            router.refresh()
        } catch {
            setError("An error occurred. Please try again.")
            setLoading(false)
        }
    }

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "background.default",
                p: 2,
            }}
        >
            <IconButton
                onClick={toggleTheme}
                sx={{ position: "absolute", top: 16, right: 16 }}
            >
                {mode === "light" ? <DarkMode /> : <LightMode />}
            </IconButton>

            <Container maxWidth="sm">
                <Card sx={{ boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
                    <CardContent sx={{ p: 4 }}>
                        <Box sx={{ textAlign: "center", mb: 4 }}>
                            <Typography variant="h4" fontWeight={700} gutterBottom>
                                Welcome Back
                            </Typography>
                            <Typography color="text.secondary">
                                Sign in to your account
                            </Typography>
                        </Box>

                        {error && (
                            <Alert severity="error" sx={{ mb: 3 }}>
                                {error}
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit}>
                            <TextField
                                fullWidth
                                label="Email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                sx={{ mb: 2 }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Email color="action" />
                                        </InputAdornment>
                                    ),
                                }}
                                required
                            />

                            <TextField
                                fullWidth
                                label="Password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                sx={{ mb: 3 }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Lock color="action" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                required
                            />

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                size="large"
                                disabled={loading}
                                sx={{ py: 1.5, mb: 2 }}
                            >
                                {loading ? <CircularProgress size={24} /> : "Sign In"}
                            </Button>
                        </form>

                        <Box sx={{ textAlign: "center" }}>
                            <Typography color="text.secondary">
                                Don't have an account?{" "}
                                <MuiLink
                                    component={Link}
                                    href="/register"
                                    sx={{ fontWeight: 600, textDecoration: "none" }}
                                >
                                    Sign Up
                                </MuiLink>
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    )
}
