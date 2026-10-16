CREATE TABLE "admin_assistant_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"actor_id" text NOT NULL,
	"action" jsonb NOT NULL,
	"previous" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
