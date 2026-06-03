import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  varchar,
  doublePrecision,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";

/* ── Enums ─────────────────────────────────────────────── */

export const sessionStatusEnum = pgEnum("session_status", [
  "PENDING",
  "COMPLETED",
  "DISQUALIFIED",
]);

export const transactionTypeEnum = pgEnum("transaction_type", [
  "EARNED_SURVEY",
  "WITHDRAWAL",
  "REFERRAL_BONUS",
  "DAILY_BONUS",
  "ACHIEVEMENT",
  "STREAK_BONUS",
  "LUCKY_DRAW",
]);

export const transactionStatusEnum = pgEnum("transaction_status", [
  "PENDING",
  "COMPLETED",
  "FAILED",
]);

/* ── Users ─────────────────────────────────────────────── */

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: varchar("display_name", { length: 100 }).notNull().default("User"),
  avatarUrl: text("avatar_url"),
  pointsBalance: integer("points_balance").notNull().default(0),
  totalEarned: integer("total_earned").notNull().default(0),
  surveysCompleted: integer("surveys_completed").notNull().default(0),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  lastStreakDate: timestamp("last_streak_date"),
  referralCode: varchar("referral_code", { length: 20 }).unique(),
  referredBy: uuid("referred_by"),
  darkMode: boolean("dark_mode").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/* ── Survey Wall Sessions ──────────────────────────────── */

export const surveyWallSessions = pgTable("survey_wall_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  trackingId: varchar("tracking_id", { length: 255 }).notNull().unique(),
  status: sessionStatusEnum("status").notNull().default("PENDING"),
  earnedPoints: integer("earned_points").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/* ── Transactions ──────────────────────────────────────── */

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  type: transactionTypeEnum("type").notNull(),
  points: integer("points").notNull(),
  currencyAmount: doublePrecision("currency_amount").notNull().default(0),
  status: transactionStatusEnum("status").notNull().default("PENDING"),
  referenceId: varchar("reference_id", { length: 255 }),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ── Referrals ─────────────────────────────────────────── */

export const referrals = pgTable("referrals", {
  id: uuid("id").defaultRandom().primaryKey(),
  referrerId: uuid("referrer_id")
    .notNull()
    .references(() => users.id),
  referredId: uuid("referred_id")
    .notNull()
    .references(() => users.id),
  bonusPoints: integer("bonus_points").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ── Achievements ──────────────────────────────────────── */

export const achievements = pgTable("achievements", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  badge: varchar("badge", { length: 100 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
});

/* ── Notifications ─────────────────────────────────────── */

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
