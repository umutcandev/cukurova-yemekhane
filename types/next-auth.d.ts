import { DefaultSession, DefaultJWT } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            isModerator?: boolean;
        } & DefaultSession["user"];
    }
}

declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        isModerator?: boolean;
    }
}
