import { DefaultSession, DefaultJWT } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            isModerator?: boolean;
            nickname?: string | null;
            customImage?: string | null;
            hideProfilePicture?: boolean;
        } & DefaultSession["user"];
    }
}

declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        isModerator?: boolean;
        nickname?: string | null;
        customImage?: string | null;
        hideProfilePicture?: boolean;
    }
}
