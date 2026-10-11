CREATE TABLE "wallet_service_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"wallet_id" uuid NOT NULL,
	"request_id" uuid NOT NULL,
	"sku" text NOT NULL,
	"title" text NOT NULL,
	"amount" integer NOT NULL,
	"billing_cycle" text NOT NULL,
	"status" text DEFAULT 'paid' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_payment_gateways" (
	"gateway" text PRIMARY KEY,
	"merchant_id" uuid NOT NULL,
	"admin_id" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"wallet_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"description" text NOT NULL,
	"document_id" uuid UNIQUE,
	"order_id" uuid UNIQUE,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_entry_direction" CHECK (("amount" > 0 AND "document_id" IS NOT NULL AND "order_id" IS NULL) OR ("amount" < 0 AND "order_id" IS NOT NULL AND "document_id" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "wallet_topups" (
	"document_id" uuid PRIMARY KEY,
	"wallet_id" uuid NOT NULL,
	"request_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"owner_id" text NOT NULL UNIQUE,
	"balance" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_balance_nonnegative" CHECK ("balance" >= 0 AND "balance" <= 9007199254740991)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_order_request" ON "wallet_service_orders" ("wallet_id","request_id");--> statement-breakpoint
CREATE INDEX "wallet_entries_owner_created" ON "wallet_entries" ("wallet_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_topup_request" ON "wallet_topups" ("wallet_id","request_id");--> statement-breakpoint
ALTER TABLE "wallet_service_orders" ADD CONSTRAINT "wallet_service_orders_wallet_id_customer_wallets_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "customer_wallets"("id");--> statement-breakpoint
ALTER TABLE "site_payment_gateways" ADD CONSTRAINT "site_payment_gateways_merchant_id_merchants_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id");--> statement-breakpoint
ALTER TABLE "wallet_entries" ADD CONSTRAINT "wallet_entries_wallet_id_customer_wallets_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "customer_wallets"("id");--> statement-breakpoint
ALTER TABLE "wallet_entries" ADD CONSTRAINT "wallet_entries_document_id_payment_documents_id_fkey" FOREIGN KEY ("document_id") REFERENCES "payment_documents"("id");--> statement-breakpoint
ALTER TABLE "wallet_entries" ADD CONSTRAINT "wallet_entries_order_id_wallet_service_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "wallet_service_orders"("id");--> statement-breakpoint
ALTER TABLE "wallet_topups" ADD CONSTRAINT "wallet_topups_document_id_payment_documents_id_fkey" FOREIGN KEY ("document_id") REFERENCES "payment_documents"("id");--> statement-breakpoint
ALTER TABLE "wallet_topups" ADD CONSTRAINT "wallet_topups_wallet_id_customer_wallets_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "customer_wallets"("id");