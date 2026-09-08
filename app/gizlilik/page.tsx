import type { Metadata } from "next"

import { Header } from "@/components/header"
import { ContentPageView } from "@/components/content-page"
import { privacyPage } from "@/lib/content/privacy"
import { socialMetadata } from "@/lib/seo"

export const metadata: Metadata = {
    title: privacyPage.title,
    description: privacyPage.description,
    alternates: { canonical: privacyPage.path },
    ...socialMetadata({
        title: privacyPage.title,
        description: privacyPage.description,
        path: privacyPage.path,
        article: true,
    }),
}

export default function PrivacyRoute() {
    return (
        <main className="min-h-screen bg-background">
            <Header />
            <ContentPageView page={privacyPage} />
        </main>
    )
}
