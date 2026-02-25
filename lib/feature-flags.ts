/**
 * Feature Flags
 * 
 * Vercel Edge Request limitlerini yönetmek için merkezi feature flag sistemi.
 * AUTH_ENABLED=false yapıldığında:
 * - Middleware auth kontrolü atlanır (edge request düşer)
 * - SessionProvider devre dışı kalır (otomatik /api/auth/session çağrısı yok)
 * - API route'lardaki auth() çağrıları atlanır
 * - UI'da giriş butonları "Devre Dışı" olarak gösterilir
 */

export const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED !== "false"
