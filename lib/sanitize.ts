/**
 * Robust HTML sanitizer — iteratively strips all HTML tags
 * to prevent bypass via nested/malformed tags like <scr<script>ipt>.
 */
export function sanitizeHtml(input: string): string {
    let result = input;
    let prev = "";
    // Iteratively strip until no more tags remain
    while (result !== prev) {
        prev = result;
        result = result.replace(/<[^>]*>?/g, "");
    }
    // Also strip any remaining event-handler-like patterns
    result = result.replace(/on\w+\s*=/gi, "");
    return result;
}
