import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Çukurova Üniversitesi Yemekhane",
        short_name: "ÇÜ Yemekhane",
        description: "Çukurova Üniversitesi yemekhanesinin günlük menü takibi uygulaması.",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#ffffff",
        icons: [
            {
                src: "/icons/icon-192x192.png",
                sizes: "192x192",
                type: "image/png",
            },
            {
                src: "/icons/icon-512x512.png",
                sizes: "512x512",
                type: "image/png",
            },
            {
                src: "/icons/apple-touch-icon.png",
                sizes: "180x180",
                type: "image/png",
            },
        ],
    }
}
