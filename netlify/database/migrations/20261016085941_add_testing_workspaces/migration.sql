CREATE TABLE "testing_workspaces" (
	"owner_id" text PRIMARY KEY,
	"settings" jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
