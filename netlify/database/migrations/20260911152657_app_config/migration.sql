CREATE TABLE "app_config" (
	"key" text PRIMARY KEY,
	"value" jsonb DEFAULT '{}' NOT NULL,
	"description" text,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "app_config" ADD CONSTRAINT "app_config_updated_by_users_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id");