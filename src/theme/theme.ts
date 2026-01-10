"use client"

import { createTheme } from "@mui/material/styles"

export const theme = createTheme({
    palette: {
        mode: "light",
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
            default: "#f5f5f5",
            paper: "#ffffff",
        },
        text: {
            primary: "#1a1a1a",
            secondary: "#666666",
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
        divider: "#e0e0e0",
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontWeight: 700,
            fontSize: "2.5rem",
            color: "#1a1a1a",
        },
        h2: {
            fontWeight: 600,
            fontSize: "2rem",
            color: "#1a1a1a",
        },
        h3: {
            fontWeight: 600,
            fontSize: "1.5rem",
            color: "#1a1a1a",
        },
        h4: {
            fontWeight: 600,
            fontSize: "1.25rem",
            color: "#1a1a1a",
        },
        h5: {
            fontWeight: 500,
            fontSize: "1.1rem",
            color: "#1a1a1a",
        },
        h6: {
            fontWeight: 500,
            fontSize: "1rem",
            color: "#1a1a1a",
        },
    },
    shape: {
        borderRadius: 0,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: 0,
                    padding: "8px 20px",
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
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    border: "1px solid #e0e0e0",
                    borderRadius: 0,
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    "& .MuiOutlinedInput-root": {
                        borderRadius: 0,
                    },
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    borderRight: "1px solid #e0e0e0",
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                },
            },
        },
        MuiListItemButton: {
            styleOverrides: {
                root: {
                    borderRadius: 0,
                    marginBottom: 4,
                    "&.Mui-selected": {
                        backgroundColor: "rgba(25, 118, 210, 0.08)",
                        "&:hover": {
                            backgroundColor: "rgba(25, 118, 210, 0.12)",
                        },
                    },
                },
            },
        },
    },
})

export default theme
