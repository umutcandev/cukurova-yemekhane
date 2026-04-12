import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/index";
import {
    users,
    accounts,
    sessions,
    verificationTokens,
} from "@/lib/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: DrizzleAdapter(db, {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
    }),
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID ?? (() => { throw new Error("Missing GOOGLE_CLIENT_ID env var") })(),
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? (() => { throw new Error("Missing GOOGLE_CLIENT_SECRET env var") })(),
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.isModerator = user.id === process.env.MODERATOR_USER_ID;
            }
            if (token.id) {
                const [row] = await db
                    .select({
                        nickname: users.nickname,
                        customImage: users.customImage,
                        hideProfilePicture: users.hideProfilePicture,
                    })
                    .from(users)
                    .where(eq(users.id, token.id as string));
                token.nickname = row?.nickname ?? null;
                token.customImage = row?.customImage ?? null;
                token.hideProfilePicture = row?.hideProfilePicture ?? false;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user && token.id) {
                session.user.id = token.id as string;
                session.user.isModerator = token.isModerator as boolean;
                session.user.nickname = (token.nickname as string | null) ?? null;
                session.user.customImage = (token.customImage as string | null) ?? null;
                session.user.hideProfilePicture = (token.hideProfilePicture as boolean) ?? false;
            }
            return session;
        },
    },
    pages: {
        signIn: "/",
    },
});
