"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeContextProvider } from "@/theme/ThemeContext"
import { Toaster } from "react-hot-toast"

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <ThemeContextProvider>
                {children}
                <Toaster
                    position="bottom-center"
                    toastOptions={{
                        duration: 3000,
                        style: {
                            borderRadius: 0,
                            padding: "12px 16px",
                            fontWeight: 500,
                        },
                        success: {
                            style: {
                                background: "#2e7d32",
                                color: "#fff",
                            },
                        },
                        error: {
                            style: {
                                background: "#d32f2f",
                                color: "#fff",
                            },
                        },
                    }}
                />
            </ThemeContextProvider>
        </SessionProvider>
    )
}
