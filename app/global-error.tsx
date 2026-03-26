"use client"

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <html lang="tr">
            <body>
                <div style={{
                    display: "flex",
                    minHeight: "100vh",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "1rem",
                    padding: "1rem",
                    textAlign: "center",
                    fontFamily: "system-ui, sans-serif",
                }}>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>
                        Bir hata olustu
                    </h2>
                    <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                        Uygulama beklenmeyen bir hatayla karsilasti.
                    </p>
                    <button
                        onClick={reset}
                        style={{
                            padding: "0.5rem 1rem",
                            borderRadius: "0.375rem",
                            border: "1px solid #d1d5db",
                            backgroundColor: "#fff",
                            cursor: "pointer",
                            fontSize: "0.875rem",
                        }}
                    >
                        Tekrar dene
                    </button>
                </div>
            </body>
        </html>
    )
}
