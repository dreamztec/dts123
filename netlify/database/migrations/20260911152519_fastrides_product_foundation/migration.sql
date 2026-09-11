CREATE TYPE "driver_status" AS ENUM('offline', 'available', 'assigned', 'arriving', 'arrived', 'on_trip', 'paused', 'unavailable');--> statement-breakpoint
CREATE TABLE "airports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" text NOT NULL,
	"name" text NOT NULL,
	"city_id" uuid,
	"meeting_points" jsonb DEFAULT '{}' NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "booking_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"booking_id" uuid NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"actor_id" uuid,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "corporate_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"corporate_account_id" uuid NOT NULL,
	"name" text NOT NULL,
	"allowed_vehicle_classes" jsonb DEFAULT '[]' NOT NULL,
	"allowed_services" jsonb DEFAULT '[]' NOT NULL,
	"per_trip_spend_limit" numeric(14,2),
	"monthly_trip_limit" integer,
	"monthly_spend_limit" numeric(14,2),
	"booking_permissions" jsonb DEFAULT '{}' NOT NULL,
	"approval_level" text DEFAULT 'NONE' NOT NULL,
	"max_advance_days" integer,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "decline_reasons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" text NOT NULL,
	"label" text NOT NULL,
	"legitimate" boolean DEFAULT true NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "driver_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"booking_id" uuid NOT NULL,
	"trip_id" uuid,
	"driver_id" uuid NOT NULL,
	"status" text DEFAULT 'OFFERED' NOT NULL,
	"offered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"responded_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"decline_reason" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "driver_availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"driver_id" uuid NOT NULL,
	"status" "driver_status" NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "driver_earnings_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"driver_id" uuid NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"trip_earnings" numeric(14,2) DEFAULT '0' NOT NULL,
	"active_hour_earnings" numeric(14,2) DEFAULT '0' NOT NULL,
	"productivity_bonus" numeric(14,2) DEFAULT '0' NOT NULL,
	"performance_bonus" numeric(14,2) DEFAULT '0' NOT NULL,
	"quality_bonus" numeric(14,2) DEFAULT '0' NOT NULL,
	"special_assignment_bonus" numeric(14,2) DEFAULT '0' NOT NULL,
	"deductions" numeric(14,2) DEFAULT '0' NOT NULL,
	"gross_earnings" numeric(14,2) DEFAULT '0' NOT NULL,
	"net_earnings" numeric(14,2) DEFAULT '0' NOT NULL,
	"qualifying_active_minutes" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "driver_levels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" text NOT NULL,
	"name" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"requirements" jsonb DEFAULT '{}' NOT NULL,
	"benefits" jsonb DEFAULT '[]' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "driver_performance_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"driver_id" uuid NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"punctuality" numeric(5,2) DEFAULT '0' NOT NULL,
	"acceptance_completion" numeric(5,2) DEFAULT '0' NOT NULL,
	"rating_score" numeric(5,2) DEFAULT '0' NOT NULL,
	"safety" numeric(5,2) DEFAULT '0' NOT NULL,
	"utilisation" numeric(5,2) DEFAULT '0' NOT NULL,
	"vehicle_care" numeric(5,2) DEFAULT '0' NOT NULL,
	"complaints" numeric(5,2) DEFAULT '0' NOT NULL,
	"weighted_score" numeric(5,2) DEFAULT '0' NOT NULL,
	"assignments_offered" integer DEFAULT 0 NOT NULL,
	"assignments_accepted" integer DEFAULT 0 NOT NULL,
	"assignments_declined" integer DEFAULT 0 NOT NULL,
	"weights_snapshot" jsonb DEFAULT '{}' NOT NULL,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "event_itinerary_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"event_id" uuid NOT NULL,
	"sequence" integer DEFAULT 0 NOT NULL,
	"time" timestamp with time zone,
	"title" text NOT NULL,
	"pickup" jsonb,
	"destination" jsonb,
	"vehicle_id" uuid,
	"driver_id" uuid,
	"status" text DEFAULT 'PLANNED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid,
	"driver_id" uuid,
	"booking_id" uuid,
	"trip_id" uuid,
	"kind" text DEFAULT 'TRIP_RATING' NOT NULL,
	"rating" integer,
	"categories" jsonb DEFAULT '{}' NOT NULL,
	"comment" text,
	"nps_score" integer,
	"status" text DEFAULT 'UNRESOLVED' NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "interstate_departures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"route_id" uuid NOT NULL,
	"departure_time" timestamp with time zone NOT NULL,
	"vehicle_class_id" uuid,
	"vehicle_id" uuid,
	"driver_id" uuid,
	"fare" numeric(14,2),
	"seats_total" integer DEFAULT 4 NOT NULL,
	"seats_booked" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'SCHEDULED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "loyalty_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"rule_key" text NOT NULL,
	"name" text NOT NULL,
	"rule_type" text DEFAULT 'EARN' NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"conditions" jsonb DEFAULT '{}' NOT NULL,
	"tier_multipliers" jsonb DEFAULT '{}' NOT NULL,
	"expiry_days" integer,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "notification_intents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid,
	"channel" text NOT NULL,
	"template_key" text NOT NULL,
	"recipient" text,
	"subject" text,
	"payload" jsonb DEFAULT '{}' NOT NULL,
	"booking_id" uuid,
	"status" text DEFAULT 'INTENT_RECORDED' NOT NULL,
	"provider" text,
	"provider_message_id" text,
	"failure_reason" text,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "referral_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"qualifying_event" text NOT NULL,
	"referrer_reward_type" text NOT NULL,
	"referrer_reward_value" jsonb DEFAULT '{}' NOT NULL,
	"referee_reward_type" text,
	"referee_reward_value" jsonb DEFAULT '{}' NOT NULL,
	"expiry_days" integer DEFAULT 90 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "referral_rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"referral_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"rule_key" text NOT NULL,
	"reward_type" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"qualifying_event" text,
	"issued_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "reward_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"reward_account_id" uuid NOT NULL,
	"reward_id" uuid,
	"points" integer NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"reference" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "routine_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" text NOT NULL,
	"name" text NOT NULL,
	"ride_count" integer,
	"validity_days" integer,
	"audience_type" text DEFAULT 'INDIVIDUAL' NOT NULL,
	"discount_percent" numeric(5,2),
	"package_price" numeric(14,2),
	"eligibility" jsonb DEFAULT '{}' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "routine_rides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"routine_subscription_id" uuid NOT NULL,
	"booking_id" uuid,
	"scheduled_for" timestamp with time zone NOT NULL,
	"direction" text DEFAULT 'OUTBOUND' NOT NULL,
	"status" text DEFAULT 'PLANNED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "routine_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"package_id" uuid,
	"corporate_account_id" uuid,
	"origin" jsonb NOT NULL,
	"destination" jsonb NOT NULL,
	"days" jsonb DEFAULT '[]' NOT NULL,
	"pickup_time" text,
	"return_time" text,
	"passengers" integer DEFAULT 1 NOT NULL,
	"vehicle_class_id" uuid,
	"service_type" text,
	"start_date" date,
	"end_date" date,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"remaining_rides" integer,
	"route_estimate" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"requires_route" boolean DEFAULT false NOT NULL,
	"allow_shared_ride" boolean DEFAULT false NOT NULL,
	"requires_scheduled_time" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "signup_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid,
	"audience_type" text NOT NULL,
	"question_key" text NOT NULL,
	"selected_option" text,
	"other_text" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sos_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid,
	"booking_id" uuid,
	"trip_id" uuid,
	"driver_id" uuid,
	"vehicle_id" uuid,
	"emergency_contact_id" uuid,
	"coordinates" jsonb,
	"location_available" boolean DEFAULT false NOT NULL,
	"details" text,
	"status" text DEFAULT 'RAISED' NOT NULL,
	"response_notes" text,
	"responded_by" uuid,
	"responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "wallet_ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"wallet_id" uuid NOT NULL,
	"entry_type" text NOT NULL,
	"balance_type" text NOT NULL,
	"amount" numeric(14,2) NOT NULL,
	"running_balance" numeric(14,2),
	"reason" text NOT NULL,
	"booking_id" uuid,
	"payment_id" uuid,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "airport_transfers" ADD COLUMN "luggage" jsonb DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "airport_transfers" ADD COLUMN "waiting_requirement" text;--> statement-breakpoint
ALTER TABLE "airport_transfers" ADD COLUMN "flight_status_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "airport_transfers" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "service_type" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "booking_relationship" text DEFAULT 'SELF' NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "route_snapshot" jsonb DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "fare_snapshot" jsonb DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "membership_discount" numeric(14,2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "cancellation_reason" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "cancelled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "customer_profiles" ADD COLUMN "preferred_pickup" jsonb;--> statement-breakpoint
ALTER TABLE "customer_profiles" ADD COLUMN "emergency_contact_name" text;--> statement-breakpoint
ALTER TABLE "customer_profiles" ADD COLUMN "emergency_contact_phone" text;--> statement-breakpoint
ALTER TABLE "customer_profiles" ADD COLUMN "corporate_account_id" uuid;--> statement-breakpoint
ALTER TABLE "customer_profiles" ADD COLUMN "verification_status" text DEFAULT 'UNVERIFIED' NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_profiles" ADD COLUMN "status" text DEFAULT 'ACTIVE' NOT NULL;--> statement-breakpoint
ALTER TABLE "driver_profiles" ADD COLUMN "licence_expiry" date;--> statement-breakpoint
ALTER TABLE "driver_profiles" ADD COLUMN "licence_class" text;--> statement-breakpoint
ALTER TABLE "driver_profiles" ADD COLUMN "driver_level_code" text DEFAULT 'STARTER' NOT NULL;--> statement-breakpoint
ALTER TABLE "driver_profiles" ADD COLUMN "availability_status" "driver_status" DEFAULT 'offline'::"driver_status" NOT NULL;--> statement-breakpoint
ALTER TABLE "driver_profiles" ADD COLUMN "current_vehicle_id" uuid;--> statement-breakpoint
ALTER TABLE "driver_profiles" ADD COLUMN "acceptance_rate" numeric(5,2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "driver_profiles" ADD COLUMN "completion_rate" numeric(5,2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "driver_profiles" ADD COLUMN "experience" jsonb DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "location" jsonb;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "ends_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "guest_count" integer;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "vehicles_required" integer;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "chauffeurs_required" integer;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "itinerary" jsonb DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE "recurring_bookings" ADD COLUMN "status" text DEFAULT 'ACTIVE' NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "billing_cycle" text DEFAULT 'MONTHLY' NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "cancelled_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "airports_code_idx" ON "airports" ("code");--> statement-breakpoint
CREATE INDEX "booking_events_booking_idx" ON "booking_events" ("booking_id","created_at");--> statement-breakpoint
CREATE INDEX "corporate_policies_account_idx" ON "corporate_policies" ("corporate_account_id","active");--> statement-breakpoint
CREATE UNIQUE INDEX "decline_reasons_code_idx" ON "decline_reasons" ("code");--> statement-breakpoint
CREATE INDEX "driver_assignments_driver_idx" ON "driver_assignments" ("driver_id","status");--> statement-breakpoint
CREATE INDEX "driver_availability_driver_idx" ON "driver_availability" ("driver_id","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "driver_earnings_period_idx" ON "driver_earnings_records" ("driver_id","period_start","period_end");--> statement-breakpoint
CREATE UNIQUE INDEX "driver_levels_code_idx" ON "driver_levels" ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "driver_performance_period_idx" ON "driver_performance_records" ("driver_id","period_start","period_end");--> statement-breakpoint
CREATE INDEX "drivers_availability_idx" ON "driver_profiles" ("availability_status");--> statement-breakpoint
CREATE INDEX "event_itinerary_event_idx" ON "event_itinerary_items" ("event_id","sequence");--> statement-breakpoint
CREATE INDEX "feedback_kind_idx" ON "feedback" ("kind","status");--> statement-breakpoint
CREATE INDEX "feedback_booking_idx" ON "feedback" ("booking_id");--> statement-breakpoint
CREATE INDEX "interstate_departures_route_idx" ON "interstate_departures" ("route_id","departure_time");--> statement-breakpoint
CREATE UNIQUE INDEX "loyalty_rules_key_idx" ON "loyalty_rules" ("rule_key");--> statement-breakpoint
CREATE INDEX "notification_intents_user_idx" ON "notification_intents" ("user_id","status");--> statement-breakpoint
CREATE INDEX "referral_rewards_referral_idx" ON "referral_rewards" ("referral_id");--> statement-breakpoint
CREATE UNIQUE INDEX "routine_packages_code_idx" ON "routine_packages" ("code");--> statement-breakpoint
CREATE INDEX "routine_rides_sub_idx" ON "routine_rides" ("routine_subscription_id","scheduled_for");--> statement-breakpoint
CREATE INDEX "routine_subscriptions_user_idx" ON "routine_subscriptions" ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "services_code_idx" ON "services" ("code");--> statement-breakpoint
CREATE INDEX "signup_responses_audience_idx" ON "signup_responses" ("audience_type","question_key");--> statement-breakpoint
CREATE INDEX "signup_responses_user_idx" ON "signup_responses" ("user_id");--> statement-breakpoint
CREATE INDEX "sos_alerts_status_idx" ON "sos_alerts" ("status","created_at");--> statement-breakpoint
CREATE INDEX "wallet_ledger_wallet_idx" ON "wallet_ledger_entries" ("wallet_id","recorded_at");--> statement-breakpoint
ALTER TABLE "airports" ADD CONSTRAINT "airports_city_id_cities_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id");--> statement-breakpoint
ALTER TABLE "booking_events" ADD CONSTRAINT "booking_events_booking_id_bookings_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "booking_events" ADD CONSTRAINT "booking_events_actor_id_users_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "corporate_policies" ADD CONSTRAINT "corporate_policies_9xjXMvdVgW9l_fkey" FOREIGN KEY ("corporate_account_id") REFERENCES "corporate_accounts"("id");--> statement-breakpoint
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_J8O67m3TUza2_fkey" FOREIGN KEY ("corporate_account_id") REFERENCES "corporate_accounts"("id");--> statement-breakpoint
ALTER TABLE "driver_assignments" ADD CONSTRAINT "driver_assignments_booking_id_bookings_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id");--> statement-breakpoint
ALTER TABLE "driver_assignments" ADD CONSTRAINT "driver_assignments_trip_id_trips_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id");--> statement-breakpoint
ALTER TABLE "driver_assignments" ADD CONSTRAINT "driver_assignments_driver_id_driver_profiles_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "driver_profiles"("id");--> statement-breakpoint
ALTER TABLE "driver_availability" ADD CONSTRAINT "driver_availability_driver_id_driver_profiles_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "driver_profiles"("id");--> statement-breakpoint
ALTER TABLE "driver_earnings_records" ADD CONSTRAINT "driver_earnings_records_driver_id_driver_profiles_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "driver_profiles"("id");--> statement-breakpoint
ALTER TABLE "driver_performance_records" ADD CONSTRAINT "driver_performance_records_driver_id_driver_profiles_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "driver_profiles"("id");--> statement-breakpoint
ALTER TABLE "event_itinerary_items" ADD CONSTRAINT "event_itinerary_items_event_id_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_itinerary_items" ADD CONSTRAINT "event_itinerary_items_vehicle_id_vehicles_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id");--> statement-breakpoint
ALTER TABLE "event_itinerary_items" ADD CONSTRAINT "event_itinerary_items_driver_id_driver_profiles_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "driver_profiles"("id");--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_driver_id_driver_profiles_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "driver_profiles"("id");--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_booking_id_bookings_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id");--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_trip_id_trips_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id");--> statement-breakpoint
ALTER TABLE "interstate_departures" ADD CONSTRAINT "interstate_departures_route_id_routes_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id");--> statement-breakpoint
ALTER TABLE "interstate_departures" ADD CONSTRAINT "interstate_departures_vehicle_class_id_vehicle_classes_id_fkey" FOREIGN KEY ("vehicle_class_id") REFERENCES "vehicle_classes"("id");--> statement-breakpoint
ALTER TABLE "interstate_departures" ADD CONSTRAINT "interstate_departures_vehicle_id_vehicles_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id");--> statement-breakpoint
ALTER TABLE "interstate_departures" ADD CONSTRAINT "interstate_departures_driver_id_driver_profiles_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "driver_profiles"("id");--> statement-breakpoint
ALTER TABLE "notification_intents" ADD CONSTRAINT "notification_intents_booking_id_bookings_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id");--> statement-breakpoint
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_referral_id_referrals_id_fkey" FOREIGN KEY ("referral_id") REFERENCES "referrals"("id");--> statement-breakpoint
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_reward_account_id_reward_accounts_id_fkey" FOREIGN KEY ("reward_account_id") REFERENCES "reward_accounts"("id");--> statement-breakpoint
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_reward_id_rewards_id_fkey" FOREIGN KEY ("reward_id") REFERENCES "rewards"("id");--> statement-breakpoint
ALTER TABLE "routine_rides" ADD CONSTRAINT "routine_rides_vCPXsVd3xtxx_fkey" FOREIGN KEY ("routine_subscription_id") REFERENCES "routine_subscriptions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "routine_rides" ADD CONSTRAINT "routine_rides_booking_id_bookings_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id");--> statement-breakpoint
ALTER TABLE "routine_subscriptions" ADD CONSTRAINT "routine_subscriptions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "routine_subscriptions" ADD CONSTRAINT "routine_subscriptions_package_id_routine_packages_id_fkey" FOREIGN KEY ("package_id") REFERENCES "routine_packages"("id");--> statement-breakpoint
ALTER TABLE "routine_subscriptions" ADD CONSTRAINT "routine_subscriptions_muRAnyIJqRAS_fkey" FOREIGN KEY ("corporate_account_id") REFERENCES "corporate_accounts"("id");--> statement-breakpoint
ALTER TABLE "signup_responses" ADD CONSTRAINT "signup_responses_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "sos_alerts" ADD CONSTRAINT "sos_alerts_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "sos_alerts" ADD CONSTRAINT "sos_alerts_booking_id_bookings_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id");--> statement-breakpoint
ALTER TABLE "sos_alerts" ADD CONSTRAINT "sos_alerts_trip_id_trips_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id");--> statement-breakpoint
ALTER TABLE "sos_alerts" ADD CONSTRAINT "sos_alerts_driver_id_driver_profiles_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "driver_profiles"("id");--> statement-breakpoint
ALTER TABLE "sos_alerts" ADD CONSTRAINT "sos_alerts_vehicle_id_vehicles_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id");--> statement-breakpoint
ALTER TABLE "sos_alerts" ADD CONSTRAINT "sos_alerts_emergency_contact_id_emergency_contacts_id_fkey" FOREIGN KEY ("emergency_contact_id") REFERENCES "emergency_contacts"("id");--> statement-breakpoint
ALTER TABLE "sos_alerts" ADD CONSTRAINT "sos_alerts_responded_by_users_id_fkey" FOREIGN KEY ("responded_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "wallet_ledger_entries" ADD CONSTRAINT "wallet_ledger_entries_wallet_id_wallets_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id");--> statement-breakpoint
ALTER TABLE "wallet_ledger_entries" ADD CONSTRAINT "wallet_ledger_entries_booking_id_bookings_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id");--> statement-breakpoint
ALTER TABLE "wallet_ledger_entries" ADD CONSTRAINT "wallet_ledger_entries_payment_id_payments_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id");