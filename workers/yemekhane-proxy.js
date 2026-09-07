const ORIGIN = 'https://yemekhane.cu.edu.tr'

const ALLOWED_PATHS = [
    /^\/default\.asp$/i,
    /^\/yemek-goster\.asp$/i,
    /^\/yemekler\/[\w.\-]+$/i,
]

export default {
    async fetch(request) {
        if (request.method !== 'GET') {
            return new Response('Method Not Allowed', { status: 405 })
        }

        const url = new URL(request.url)
        if (!ALLOWED_PATHS.some((pattern) => pattern.test(url.pathname))) {
            return new Response('Not Found', { status: 404 })
        }

        const upstream = await fetch(`${ORIGIN}${url.pathname}${url.search}`, {
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            cf: { cacheEverything: true, cacheTtl: 300 },
        })

        const headers = new Headers()
        const contentType = upstream.headers.get('content-type')
        if (contentType) headers.set('content-type', contentType)
        headers.set('cache-control', 'public, max-age=300')

        return new Response(upstream.body, { status: upstream.status, headers })
    },
}
