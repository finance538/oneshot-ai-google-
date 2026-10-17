CREATE TABLE "account_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"owner_id" text NOT NULL UNIQUE,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"role" text DEFAULT 'merchant' NOT NULL,
	"status" text DEFAULT 'approved' NOT NULL,
	"referral_code" text UNIQUE,
	"commission_rate" integer DEFAULT 10 NOT NULL,
	"notes" text,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "account_registration_role_valid" CHECK ("role" in ('merchant', 'marketer')),
	CONSTRAINT "account_registration_status_valid" CHECK ("status" in ('pending', 'approved', 'rejected'))
);
--> statement-breakpoint
CREATE TABLE "marketer_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"marketer_id" uuid NOT NULL,
	"owner_id" text NOT NULL,
	"title" text NOT NULL,
	"target_product_sku" text DEFAULT 'ALL' NOT NULL,
	"utm_campaign" text NOT NULL,
	"channel" text DEFAULT 'social' NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"conversions" integer DEFAULT 0 NOT NULL,
	"earned_commission" integer DEFAULT 0 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "account_registrations_role_status" ON "account_registrations" ("role","status");--> statement-breakpoint
CREATE INDEX "marketer_campaigns_owner" ON "marketer_campaigns" ("owner_id","created_at");--> statement-breakpoint
ALTER TABLE "marketer_campaigns" ADD CONSTRAINT "marketer_campaigns_marketer_id_account_registrations_id_fkey" FOREIGN KEY ("marketer_id") REFERENCES "account_registrations"("id");