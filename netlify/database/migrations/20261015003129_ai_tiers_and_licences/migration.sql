CREATE TABLE "ai_tier_entitlements" (
	"owner_id" text PRIMARY KEY,
	"tier" text DEFAULT 'tier-1' NOT NULL,
	"tier_x" boolean DEFAULT false NOT NULL,
	"granted_by" text,
	"note" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_tier_valid" CHECK ("tier" in ('tier-1', 'tier-2', 'tier-3'))
);
--> statement-breakpoint
CREATE TABLE "ai_staff_grants" (
	"owner_id" text,
	"staff_id" text,
	"granted_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_staff_grants_pkey" PRIMARY KEY("owner_id","staff_id")
);
--> statement-breakpoint
CREATE TABLE "ai_usage_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"owner_id" text NOT NULL,
	"tier" text NOT NULL,
	"model_id" text NOT NULL,
	"staff_id" text,
	"outcome" text DEFAULT 'ok' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "ai_usage_owner_created" ON "ai_usage_events" ("owner_id","created_at");