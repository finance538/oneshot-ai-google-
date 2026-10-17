CREATE TABLE "customer_profiles" (
	"owner_id" text PRIMARY KEY,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
