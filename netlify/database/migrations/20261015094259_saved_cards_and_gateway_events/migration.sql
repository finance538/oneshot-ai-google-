CREATE TABLE "gateway_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"gateway" text NOT NULL,
	"event" text NOT NULL,
	"reference" text,
	"payload" jsonb NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"merchant_id" uuid NOT NULL,
	"email" text NOT NULL,
	"gateway" text NOT NULL,
	"encrypted_token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "gateway_events_received" ON "gateway_events" ("received_at");--> statement-breakpoint
CREATE UNIQUE INDEX "saved_cards_merchant_email_gateway" ON "saved_cards" ("merchant_id","email","gateway");--> statement-breakpoint
ALTER TABLE "saved_cards" ADD CONSTRAINT "saved_cards_merchant_id_merchants_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id");