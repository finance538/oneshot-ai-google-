ALTER TABLE "merchants" ADD COLUMN "account_id" text;--> statement-breakpoint
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_account_id_key" UNIQUE("account_id");