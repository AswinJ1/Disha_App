"use client"

import { useState, useEffect } from "react"
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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Container,
} from "@mui/material"
import {
    Email,
    Lock,
    Visibility,
    VisibilityOff,
    Person,
    SupervisorAccount,
    DarkMode,
    LightMode,
} from "@mui/icons-material"
import Link from "next/link"
import { useThemeMode } from "@/theme/ThemeContext"

interface Counselor {
    id: string
    name: string
    email: string
}

export default function RegisterPage() {
    const router = useRouter()
    const { mode, toggleTheme } = useThemeMode()
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "INDIVIDUAL",
        counselorId: "",
    })
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [counselors, setCounselors] = useState<Counselor[]>([])

    useEffect(() => {
        const fetchCounselors = async () => {
            try {
                const res = await fetch("/api/counselors")
                if (res.ok) {
                    const data = await res.json()
                    setCounselors(data)
                }
            } catch (error) {
                console.error("Failed to fetch counselors:", error)
            }
        }
        fetchCounselors()
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
        const { name, value } = e.target as HTMLInputElement
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match")
            return
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters")
            return
        }

        setLoading(true)

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role,
                    counselorId: formData.role === "INDIVIDUAL" ? formData.counselorId : null,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || "Registration failed")
                setLoading(false)
                return
            }

            router.push("/login?registered=true")
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
                                Create Account
                            </Typography>
                            <Typography color="text.secondary">
                                Start tracking your daily activities
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
                                label="Full Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                sx={{ mb: 2 }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Person color="action" />
                                        </InputAdornment>
                                    ),
                                }}
                                required
                            />

                            <TextField
                                fullWidth
                                label="Email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
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

                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>I am a</InputLabel>
                                <Select
                                    name="role"
                                    value={formData.role}
                                    label="I am a"
                                    onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                                    startAdornment={
                                        <InputAdornment position="start">
                                            <SupervisorAccount color="action" />
                                        </InputAdornment>
                                    }
                                >
                                    <MenuItem value="INDIVIDUAL">Individual</MenuItem>
                                    <MenuItem value="COUNSELOR">Counselor</MenuItem>
                                </Select>
                            </FormControl>

                            {formData.role === "INDIVIDUAL" && counselors.length > 0 && (
                                <FormControl fullWidth sx={{ mb: 2 }}>
                                    <InputLabel>Select Counselor (Optional)</InputLabel>
                                    <Select
                                        name="counselorId"
                                        value={formData.counselorId}
                                        label="Select Counselor (Optional)"
                                        onChange={(e) => setFormData((prev) => ({ ...prev, counselorId: e.target.value }))}
                                    >
                                        <MenuItem value="">None</MenuItem>
                                        {counselors.map((counselor) => (
                                            <MenuItem key={counselor.id} value={counselor.id}>
                                                {counselor.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}

                            <TextField
                                fullWidth
                                label="Password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={handleChange}
                                sx={{ mb: 2 }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Lock color="action" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                required
                            />

                            <TextField
                                fullWidth
                                label="Confirm Password"
                                name="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                sx={{ mb: 3 }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Lock color="action" />
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
                                {loading ? <CircularProgress size={24} /> : "Create Account"}
                            </Button>
                        </form>

                        <Box sx={{ textAlign: "center" }}>
                            <Typography color="text.secondary">
                                Already have an account?{" "}
                                <MuiLink
                                    component={Link}
                                    href="/login"
                                    sx={{ fontWeight: 600, textDecoration: "none" }}
                                >
                                    Sign In
                                </MuiLink>
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    )
}
