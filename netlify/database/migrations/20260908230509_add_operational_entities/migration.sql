CREATE TABLE "event_passengers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"event_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"phone" text,
	"pickup" jsonb,
	"assigned_vehicle_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "event_vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"event_id" uuid NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"driver_id" uuid,
	"assignment" jsonb DEFAULT '{}' NOT NULL,
	"status" text DEFAULT 'PLANNED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "favourite_chauffeurs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"driver_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "favourite_vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "promotions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"promotion_type" text NOT NULL,
	"rules" jsonb NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" text NOT NULL,
	"name" text NOT NULL,
	"reward_type" text NOT NULL,
	"points_cost" integer NOT NULL,
	"value" jsonb NOT NULL,
	"membership_eligibility" jsonb DEFAULT '[]' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX "favourite_chauffeur_idx" ON "favourite_chauffeurs" ("user_id","driver_id");--> statement-breakpoint
CREATE UNIQUE INDEX "favourite_vehicle_idx" ON "favourite_vehicles" ("user_id","vehicle_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rewards_code_idx" ON "rewards" ("code");--> statement-breakpoint
ALTER TABLE "event_passengers" ADD CONSTRAINT "event_passengers_event_id_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_passengers" ADD CONSTRAINT "event_passengers_assigned_vehicle_id_vehicles_id_fkey" FOREIGN KEY ("assigned_vehicle_id") REFERENCES "vehicles"("id");--> statement-breakpoint
ALTER TABLE "event_vehicles" ADD CONSTRAINT "event_vehicles_event_id_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_vehicles" ADD CONSTRAINT "event_vehicles_vehicle_id_vehicles_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id");--> statement-breakpoint
ALTER TABLE "event_vehicles" ADD CONSTRAINT "event_vehicles_driver_id_driver_profiles_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "driver_profiles"("id");--> statement-breakpoint
ALTER TABLE "favourite_chauffeurs" ADD CONSTRAINT "favourite_chauffeurs_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "favourite_chauffeurs" ADD CONSTRAINT "favourite_chauffeurs_driver_id_driver_profiles_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "driver_profiles"("id");--> statement-breakpoint
ALTER TABLE "favourite_vehicles" ADD CONSTRAINT "favourite_vehicles_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "favourite_vehicles" ADD CONSTRAINT "favourite_vehicles_vehicle_id_vehicles_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id");