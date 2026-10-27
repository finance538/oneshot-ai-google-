CREATE TABLE "admin_config" (
	"id" text PRIMARY KEY,
	"config" jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "beta_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" text NOT NULL,
	"category" text NOT NULL,
	"page" text DEFAULT '' NOT NULL,
	"model_id" text,
	"message" text NOT NULL,
	"rewarded" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_contexts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"name_en" text DEFAULT '' NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"guardrails" jsonb DEFAULT '[]' NOT NULL,
	"projects" jsonb DEFAULT '[]' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_tier_entitlements" ADD COLUMN "banned_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "beta_feedback_created" ON "beta_feedback" ("created_at");