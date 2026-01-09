"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material/styles"
import { CssBaseline } from "@mui/material"

type ThemeMode = "light" | "dark"

interface ThemeContextType {
    mode: ThemeMode
    toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useThemeMode() {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error("useThemeMode must be used within ThemeContextProvider")
    }
    return context
}

const getTheme = (mode: ThemeMode) =>
    createTheme({
        palette: {
            mode,
            primary: {
                main: "#1976d2",
                light: "#42a5f5",
                dark: "#1565c0",
            },
            secondary: {
                main: "#9c27b0",
                light: "#ba68c8",
                dark: "#7b1fa2",
            },
            background: {
                default: mode === "light" ? "#f5f5f5" : "#0a0a0a",
                paper: mode === "light" ? "#ffffff" : "#1a1a1a",
            },
            text: {
                primary: mode === "light" ? "#1a1a1a" : "#f5f5f5",
                secondary: mode === "light" ? "#666666" : "#a0a0a0",
            },
            success: {
                main: "#2e7d32",
                light: "#4caf50",
                dark: "#1b5e20",
            },
            warning: {
                main: "#ed6c02",
                light: "#ff9800",
                dark: "#e65100",
            },
            error: {
                main: "#d32f2f",
                light: "#ef5350",
                dark: "#c62828",
            },
            divider: mode === "light" ? "#e0e0e0" : "#333333",
        },
        typography: {
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
            h1: { fontWeight: 700 },
            h2: { fontWeight: 600 },
            h3: { fontWeight: 600 },
            h4: { fontWeight: 600 },
            h5: { fontWeight: 500 },
            h6: { fontWeight: 500 },
        },
        shape: {
            borderRadius: 8,
        },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        textTransform: "none",
                        fontWeight: 600,
                        borderRadius: 8,
                    },
                    contained: {
                        boxShadow: "none",
                        "&:hover": {
                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        },
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        boxShadow: mode === "light" ? "0 1px 3px rgba(0,0,0,0.08)" : "0 1px 3px rgba(0,0,0,0.3)",
                        border: `1px solid ${mode === "light" ? "#e0e0e0" : "#333333"}`,
                        borderRadius: 12,
                    },
                },
            },
            MuiDrawer: {
                styleOverrides: {
                    paper: {
                        borderRight: `1px solid ${mode === "light" ? "#e0e0e0" : "#333333"}`,
                    },
                },
            },
            MuiListItemButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 8,
                        marginBottom: 4,
                        "&.Mui-selected": {
                            backgroundColor: mode === "light" ? "rgba(25, 118, 210, 0.08)" : "rgba(25, 118, 210, 0.16)",
                        },
                    },
                },
            },
        },
    })

export function ThemeContextProvider({ children }: { children: ReactNode }) {
    const [mode, setMode] = useState<ThemeMode>("light")

    useEffect(() => {
        const saved = localStorage.getItem("theme") as ThemeMode | null
        if (saved) {
            setMode(saved)
        }
    }, [])

    const toggleTheme = () => {
        const newMode = mode === "light" ? "dark" : "light"
        setMode(newMode)
        localStorage.setItem("theme", newMode)
    }

    const theme = getTheme(mode)

    return (
        <ThemeContext.Provider value={{ mode, toggleTheme }}>
            <MuiThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </MuiThemeProvider>
        </ThemeContext.Provider>
    )
}
