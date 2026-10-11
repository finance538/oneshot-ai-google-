CREATE TABLE "operations_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"actor_id" text NOT NULL,
	"event_id" uuid,
	"merchant_id" uuid,
	"action" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operations_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"source_key" text NOT NULL UNIQUE,
	"kind" text NOT NULL,
	"merchant_id" uuid,
	"subject_id" text NOT NULL,
	"provider" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operations_receipts" (
	"event_id" uuid,
	"actor_id" text,
	"read_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "operations_receipts_pkey" PRIMARY KEY("event_id","actor_id")
);
--> statement-breakpoint
CREATE TABLE "operations_connection_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"merchant_id" uuid NOT NULL,
	"actor_id" text NOT NULL,
	"status" text DEFAULT 'pending_setup' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "operations_audit_actor_created" ON "operations_audit" ("actor_id","created_at");--> statement-breakpoint
CREATE INDEX "operations_events_created" ON "operations_events" ("created_at","id");--> statement-breakpoint
CREATE INDEX "operations_events_tenant_kind" ON "operations_events" ("merchant_id","kind");--> statement-breakpoint
ALTER TABLE "operations_audit" ADD CONSTRAINT "operations_audit_event_id_operations_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "operations_events"("id");--> statement-breakpoint
ALTER TABLE "operations_audit" ADD CONSTRAINT "operations_audit_merchant_id_merchants_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id");--> statement-breakpoint
ALTER TABLE "operations_events" ADD CONSTRAINT "operations_events_merchant_id_merchants_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id");--> statement-breakpoint
ALTER TABLE "operations_receipts" ADD CONSTRAINT "operations_receipts_event_id_operations_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "operations_events"("id");--> statement-breakpoint
ALTER TABLE "operations_connection_requests" ADD CONSTRAINT "operations_connection_requests_merchant_id_merchants_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id");
--> statement-breakpoint
INSERT INTO "operations_events" ("source_key", "kind", "merchant_id", "subject_id", "created_at")
SELECT 'merchant:' || "id"::text, 'merchant_registration', "id", "id"::text, "created_at" FROM "merchants"
ON CONFLICT ("source_key") DO NOTHING;
--> statement-breakpoint
INSERT INTO "operations_events" ("source_key", "kind", "merchant_id", "subject_id", "provider", "created_at")
SELECT 'gateway:' || "id"::text, 'gateway_request', "merchant_id", "id"::text,
CASE WHEN "gateway" IN ('paytabs', 'telr') THEN "gateway" ELSE NULL END, "created_at" FROM "gateway_connection_requests"
ON CONFLICT ("source_key") DO NOTHING;
