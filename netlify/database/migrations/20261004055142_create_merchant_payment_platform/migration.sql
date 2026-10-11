CREATE TABLE "payment_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"document_id" uuid NOT NULL,
	"merchant_id" uuid NOT NULL,
	"period" text NOT NULL UNIQUE,
	"amount" integer NOT NULL,
	"status" text DEFAULT 'processing' NOT NULL,
	"reference" text UNIQUE,
	"gateway_url" text,
	"consent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"merchant_id" uuid NOT NULL,
	"title" text NOT NULL,
	"customer_name" text NOT NULL,
	"customer_email" text NOT NULL,
	"amount" integer NOT NULL,
	"method" text NOT NULL,
	"interval" text DEFAULT 'monthly' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"gateway_url" text,
	"gateway_id" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "merchants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"owner_id" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_rate_limits" (
	"key" text PRIMARY KEY,
	"count" integer DEFAULT 1 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"document_id" uuid NOT NULL UNIQUE,
	"merchant_id" uuid NOT NULL,
	"encrypted_token" text NOT NULL,
	"initial_reference" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"next_charge_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "documents_merchant_created" ON "payment_documents" ("merchant_id","id");--> statement-breakpoint
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_document_id_payment_documents_id_fkey" FOREIGN KEY ("document_id") REFERENCES "payment_documents"("id");--> statement-breakpoint
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_merchant_id_merchants_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id");--> statement-breakpoint
ALTER TABLE "payment_documents" ADD CONSTRAINT "payment_documents_merchant_id_merchants_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id");--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_document_id_payment_documents_id_fkey" FOREIGN KEY ("document_id") REFERENCES "payment_documents"("id");--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_merchant_id_merchants_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id");