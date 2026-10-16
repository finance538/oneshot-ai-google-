CREATE TABLE "voice_transcripts" (
	"owner_id" text,
	"id" uuid,
	"title" text NOT NULL,
	"transcript_text" text NOT NULL,
	"duration_seconds" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "voice_transcripts_pkey" PRIMARY KEY("owner_id","id")
);
--> statement-breakpoint
CREATE INDEX "voice_transcripts_owner_created" ON "voice_transcripts" ("owner_id","created_at");