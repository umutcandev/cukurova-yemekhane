import type { Metadata } from "next"

import { Header } from "@/components/header"
import { ContentPageView } from "@/components/content-page"
import { aboutPage } from "@/lib/content/about"
import { socialMetadata } from "@/lib/seo"

export const metadata: Metadata = {
    title: aboutPage.title,
    description: aboutPage.description,
    alternates: { canonical: aboutPage.path },
    ...socialMetadata({
        title: aboutPage.title,
        description: aboutPage.description,
        path: aboutPage.path,
        article: true,
    }),
}

export default function AboutRoute() {
    return (
        <main className="min-h-screen bg-background">
            <Header />
            <ContentPageView page={aboutPage} />
        </main>
    )
}
