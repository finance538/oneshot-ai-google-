CREATE TABLE "gateway_connection_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"merchant_id" uuid NOT NULL,
	"gateway" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"variables" jsonb NOT NULL,
	"notes" text,
	"submitted_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gateway_connection_requests" ADD CONSTRAINT "gateway_connection_requests_merchant_id_merchants_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id");