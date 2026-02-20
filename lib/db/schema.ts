import {
    pgTable,
    text,
    timestamp,
    integer,
    primaryKey,
    jsonb,
    date,
    serial,
    uniqueIndex,
    boolean,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// ==========================================
// Existing Table (preserved from raw SQL)
// ==========================================

export const menuReactions = pgTable("menu_reactions", {
    id: serial("id").primaryKey(),
    menuDate: text("menu_date").unique().notNull(),
    likeCount: integer("like_count").default(0).notNull(),
    dislikeCount: integer("dislike_count").default(0).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

// ==========================================
// NextAuth.js Tables
// ==========================================

export const users = pgTable("users", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    name: text("name"),
    email: text("email").unique(),
    emailVerified: timestamp("emailVerified", { mode: "date" }),
    image: text("image"),
});

export const accounts = pgTable(
    "accounts",
    {
        userId: text("userId")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        type: text("type").$type<AdapterAccountType>().notNull(),
        provider: text("provider").notNull(),
        providerAccountId: text("providerAccountId").notNull(),
        refresh_token: text("refresh_token"),
        access_token: text("access_token"),
        expires_at: integer("expires_at"),
        token_type: text("token_type"),
        scope: text("scope"),
        id_token: text("id_token"),
        session_state: text("session_state"),
    },
    (account) => [
        primaryKey({
            columns: [account.provider, account.providerAccountId],
        }),
    ]
);

export const sessions = pgTable("sessions", {
    sessionToken: text("sessionToken").primaryKey(),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
    "verificationTokens",
    {
        identifier: text("identifier").notNull(),
        token: text("token").notNull(),
        expires: timestamp("expires", { mode: "date" }).notNull(),
    },
    (verificationToken) => [
        primaryKey({
            columns: [verificationToken.identifier, verificationToken.token],
        }),
    ]
);

// ==========================================
// Application Tables
// ==========================================

export const favorites = pgTable(
    "favorites",
    {
        id: serial("id").primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        mealId: text("meal_id"),
        mealName: text("meal_name").notNull(),
        createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex("favorites_user_meal_idx").on(table.userId, table.mealName),
    ]
);

export const emailPreferences = pgTable(
    "email_preferences",
    {
        id: serial("id").primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        notifyFavorites: boolean("notify_favorites").default(false).notNull(),
        createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex("email_prefs_user_idx").on(table.userId),
    ]
);

export const dailyLogs = pgTable(
    "daily_logs",
    {
        id: serial("id").primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        date: date("date").notNull(),
        totalCalories: integer("total_calories").default(0).notNull(),
        consumedMeals: jsonb("consumed_meals")
            .$type<Array<{ mealName: string; calories: number }>>()
            .default([])
            .notNull(),
    },
    (table) => [
        uniqueIndex("daily_logs_user_date_idx").on(table.userId, table.date),
    ]
);
