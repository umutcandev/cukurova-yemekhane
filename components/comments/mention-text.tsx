"use client"

import { Fragment } from "react"

/**
 * Renders comment text with @mentions highlighted in primary color and bold.
 * Pattern: @Name or @Name Surname (captures @ followed by word chars and spaces up to 30 chars)
 */
export function MentionText({ text }: { text: string }) {
    // Match @Username patterns — \u00A0 is treated as whitespace by JS regex \S, so we include it explicitly
    const parts = text.split(/(@[\S\u00A0]+)/g)

    return (
        <>
            {parts.map((part, i) =>
                part.startsWith("@") ? (
                    <span
                        key={i}
                        className="inline-flex items-center gap-0.5 bg-primary/10 text-primary font-medium rounded px-1 py-px text-[0.9em] align-baseline mx-0.5"
                    >
                        {part}
                    </span>
                ) : (
                    <Fragment key={i}>{part}</Fragment>
                )
            )}
        </>
    )
}
