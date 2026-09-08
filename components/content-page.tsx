import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { CONTENT_UPDATED } from "@/lib/site"
import type { ContentPage } from "@/lib/content/types"

/**
 * Metin sayfalarının ortak kabuğu. Sunucu bileşeni: içerik ham HTML'de
 * gelir, JavaScript gerektirmez.
 */
export function ContentPageView({ page }: { page: ContentPage }) {
    return (
        <div className="container mx-auto px-4 py-6 md:py-8 max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                    <Link href="/" aria-label="Menüye dön">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-lg font-semibold text-foreground">{page.title}</h1>
            </div>

            <p className="text-sm text-foreground/90 leading-relaxed">{page.intro}</p>

            <div className="mt-8 space-y-8">
                {page.sections.map((section) => (
                    <section key={section.heading} className="space-y-3">
                        <h2 className="text-base font-semibold text-foreground">
                            {section.heading}
                        </h2>

                        {section.paragraphs?.map((paragraph) => (
                            <p
                                key={paragraph}
                                className="text-sm text-muted-foreground leading-relaxed"
                            >
                                {paragraph}
                            </p>
                        ))}

                        {section.bullets && (
                            <ul className="space-y-2 pl-1">
                                {section.bullets.map((bullet) => (
                                    <li
                                        key={bullet}
                                        className="text-sm text-muted-foreground leading-relaxed flex gap-2.5"
                                    >
                                        <span
                                            aria-hidden="true"
                                            className="mt-[0.45rem] h-1 w-1 rounded-full bg-muted-foreground/50 shrink-0"
                                        />
                                        <span>{bullet}</span>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {section.links && (
                            <ul className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
                                {section.links.map((link) => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            {...(link.href.startsWith("http")
                                                ? { target: "_blank", rel: "noopener noreferrer" }
                                                : {})}
                                            className="text-sm text-foreground font-medium underline underline-offset-2 hover:text-primary"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                ))}
            </div>

            <p className="mt-10 text-xs text-muted-foreground/70">
                Son güncelleme:{" "}
                {CONTENT_UPDATED.toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    timeZone: "Europe/Istanbul",
                })}
            </p>
        </div>
    )
}
