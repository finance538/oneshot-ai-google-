CREATE TABLE "open_payment_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"merchant_id" uuid NOT NULL,
	"title" text NOT NULL,
	"minimum" integer NOT NULL,
	"maximum" integer NOT NULL,
	"allowed_methods" jsonb NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"id" text PRIMARY KEY,
	"policy" jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_settings_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"actor_id" text NOT NULL,
	"policy" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payment_documents" ADD COLUMN "open_link_id" uuid;--> statement-breakpoint
ALTER TABLE "payment_documents" ADD COLUMN "public_request_id" uuid;--> statement-breakpoint
ALTER TABLE "payment_documents" ADD CONSTRAINT "payment_documents_public_request_id_key" UNIQUE("public_request_id");--> statement-breakpoint
ALTER TABLE "payment_documents" ADD CONSTRAINT "payment_documents_open_link_id_open_payment_links_id_fkey" FOREIGN KEY ("open_link_id") REFERENCES "open_payment_links"("id");--> statement-breakpoint
ALTER TABLE "open_payment_links" ADD CONSTRAINT "open_payment_links_merchant_id_merchants_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id");