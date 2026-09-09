CREATE TYPE "booking_status" AS ENUM('DRAFT', 'PENDING_PAYMENT', 'CONFIRMED', 'SEARCHING_DRIVER', 'DRIVER_ASSIGNED', 'DRIVER_EN_ROUTE', 'DRIVER_ARRIVED', 'PASSENGER_ONBOARD', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'INCIDENT', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "fuel_type" AS ENUM('PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC');--> statement-breakpoint
CREATE TYPE "payment_status" AS ENUM('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "user_role" AS ENUM('customer', 'driver', 'fleet_manager', 'admin', 'corporate_admin', 'corporate_rider', 'super_admin');--> statement-breakpoint
CREATE TYPE "shared_ride_status" AS ENUM('AVAILABLE', 'MATCHING', 'MATCHED', 'PICKUP_PENDING', 'PICKING_UP', 'IN_TRANSIT', 'DROPPING_OFF', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "airport_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"booking_id" uuid NOT NULL,
	"airport_code" text NOT NULL,
	"flight_number" text,
	"direction" text NOT NULL,
	"meet_and_greet" boolean DEFAULT false NOT NULL,
	"flight_provider_reference" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"actor_id" uuid,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"ip_address" text,
	"device_data" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_passengers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"booking_id" uuid NOT NULL,
	"user_id" uuid,
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"is_booker" boolean DEFAULT false NOT NULL,
	"special_instructions" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"reference" text NOT NULL,
	"booker_id" uuid NOT NULL,
	"corporate_account_id" uuid,
	"city_id" uuid NOT NULL,
	"vehicle_class_id" uuid,
	"trip_type" text NOT NULL,
	"status" "booking_status" DEFAULT 'DRAFT'::"booking_status" NOT NULL,
	"pickup" jsonb NOT NULL,
	"destination" jsonb NOT NULL,
	"scheduled_at" timestamp with time zone,
	"passenger_count" integer DEFAULT 1 NOT NULL,
	"luggage" jsonb DEFAULT '{}' NOT NULL,
	"special_instructions" text,
	"shared_ride_eligible" boolean DEFAULT false NOT NULL,
	"estimate" jsonb DEFAULT '{}' NOT NULL,
	"cancellation_rule_snapshot" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "charging_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"vehicle_id" uuid NOT NULL,
	"energy_kwh" numeric(10,2) NOT NULL,
	"cost" numeric(14,2) NOT NULL,
	"charging_location" text,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"provider_data" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"state" text NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"operating_hours" jsonb DEFAULT '{}' NOT NULL,
	"settings" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "corporate_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"registration_number" text,
	"billing_email" text NOT NULL,
	"billing_type" text DEFAULT 'PREPAID' NOT NULL,
	"credit_limit" numeric(14,2),
	"monthly_spend_limit" numeric(14,2),
	"status" text DEFAULT 'PENDING' NOT NULL,
	"settings" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "corporate_contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"corporate_account_id" uuid NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date,
	"pricing_model" text NOT NULL,
	"payment_terms" text,
	"approved_vehicle_classes" jsonb DEFAULT '[]' NOT NULL,
	"credit_limit" numeric(14,2),
	"monthly_spend_limit" numeric(14,2),
	"approval_rules" jsonb DEFAULT '{}' NOT NULL,
	"included_services" jsonb DEFAULT '[]' NOT NULL,
	"special_rates" jsonb DEFAULT '{}' NOT NULL,
	"notes" text,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "corporate_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"corporate_account_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"department_id" uuid,
	"authorisation_level" text DEFAULT 'RIDER' NOT NULL,
	"ride_limit" numeric(14,2),
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" text NOT NULL,
	"discount_type" text NOT NULL,
	"value" numeric(14,2) NOT NULL,
	"conditions" jsonb DEFAULT '{}' NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"usage_limit" integer,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "customer_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"date_of_birth" date,
	"profile_photo_url" text,
	"business_name" text,
	"preferred_vehicle_class_id" uuid,
	"acquisition_source" text,
	"preferences" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"corporate_account_id" uuid NOT NULL,
	"name" text NOT NULL,
	"monthly_limit" numeric(14,2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"owner_type" text NOT NULL,
	"owner_id" uuid NOT NULL,
	"document_type" text NOT NULL,
	"storage_key" text NOT NULL,
	"expires_at" date,
	"verification_status" text DEFAULT 'PENDING' NOT NULL,
	"reviewed_by" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "driver_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"licence_number" text,
	"years_experience" integer DEFAULT 0 NOT NULL,
	"rating" numeric(3,2) DEFAULT '0' NOT NULL,
	"completed_trips" integer DEFAULT 0 NOT NULL,
	"training_status" text DEFAULT 'PENDING' NOT NULL,
	"chauffeur_status" text DEFAULT 'INACTIVE' NOT NULL,
	"safety_score" numeric(5,2) DEFAULT '0' NOT NULL,
	"performance_score" numeric(5,2) DEFAULT '0' NOT NULL,
	"contract_status" text DEFAULT 'PENDING' NOT NULL,
	"emergency_info" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "emergency_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"relationship" text,
	"primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"corporate_account_id" uuid,
	"client_user_id" uuid,
	"name" text NOT NULL,
	"event_type" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"venue" jsonb NOT NULL,
	"operations_notes" text,
	"status" text DEFAULT 'PLANNING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fuel_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"vehicle_id" uuid NOT NULL,
	"litres" numeric(10,2) NOT NULL,
	"cost" numeric(14,2) NOT NULL,
	"mileage_km" integer,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"reporter_id" uuid NOT NULL,
	"trip_id" uuid,
	"vehicle_id" uuid,
	"driver_id" uuid,
	"incident_type" text NOT NULL,
	"priority" text DEFAULT 'MEDIUM' NOT NULL,
	"details" text NOT NULL,
	"location" jsonb,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"workflow_snapshot" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"invoice_id" uuid NOT NULL,
	"booking_id" uuid,
	"description" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_amount" numeric(14,2) NOT NULL,
	"total" numeric(14,2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"invoice_number" text NOT NULL,
	"corporate_account_id" uuid NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"subtotal" numeric(14,2) NOT NULL,
	"discounts" numeric(14,2) DEFAULT '0' NOT NULL,
	"taxes_and_fees" numeric(14,2) DEFAULT '0' NOT NULL,
	"total" numeric(14,2) NOT NULL,
	"due_date" date NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "maintenance_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"vehicle_id" uuid NOT NULL,
	"record_type" text NOT NULL,
	"service_date" date NOT NULL,
	"mileage_km" integer,
	"cost" numeric(14,2),
	"provider" text,
	"notes" text,
	"next_service_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "membership_benefits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"plan_id" uuid NOT NULL,
	"benefit_key" text NOT NULL,
	"label" text NOT NULL,
	"value" jsonb NOT NULL,
	"limits" jsonb DEFAULT '{}' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "membership_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"monthly_price" numeric(14,2),
	"annual_price" numeric(14,2),
	"trial_price" numeric(14,2),
	"trial_days" integer DEFAULT 0 NOT NULL,
	"grace_period_days" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"channel" text NOT NULL,
	"template_key" text NOT NULL,
	"subject" text,
	"content" jsonb NOT NULL,
	"status" text DEFAULT 'QUEUED' NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "operating_zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"city_id" uuid NOT NULL,
	"name" text NOT NULL,
	"zone_type" text NOT NULL,
	"geometry" jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"shared_ride_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "payment_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"payment_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"provider_event_id" text,
	"signature_verified" boolean DEFAULT false NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid,
	"booking_id" uuid,
	"amount" numeric(14,2) NOT NULL,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"provider" text NOT NULL,
	"provider_reference" text NOT NULL,
	"status" "payment_status" DEFAULT 'PENDING'::"payment_status" NOT NULL,
	"payment_method" text,
	"verified_at" timestamp with time zone,
	"raw_response" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pricing_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"priority" integer DEFAULT 100 NOT NULL,
	"city_id" uuid,
	"vehicle_class_id" uuid,
	"service_type" text,
	"pricing_type" text NOT NULL,
	"conditions" jsonb DEFAULT '{}' NOT NULL,
	"calculation" jsonb NOT NULL,
	"active_from" timestamp with time zone,
	"active_until" timestamp with time zone,
	"active" boolean DEFAULT true NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pricing_zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"city_id" uuid NOT NULL,
	"name" text NOT NULL,
	"geometry" jsonb NOT NULL,
	"surcharge" numeric(14,2),
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "recurring_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"corporate_account_id" uuid,
	"recurrence_rule" jsonb NOT NULL,
	"booking_template" jsonb NOT NULL,
	"next_run_at" timestamp with time zone,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"referrer_id" uuid NOT NULL,
	"referred_user_id" uuid,
	"code" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"qualifying_transaction_id" uuid,
	"fraud_signals" jsonb DEFAULT '[]' NOT NULL,
	"reward_data" jsonb DEFAULT '{}' NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "reward_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"points_balance" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "reward_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"reward_account_id" uuid NOT NULL,
	"transaction_type" text NOT NULL,
	"points" integer NOT NULL,
	"rule_key" text NOT NULL,
	"expires_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "routes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"origin_city_id" uuid NOT NULL,
	"destination_city_id" uuid NOT NULL,
	"distance_km" numeric(10,2),
	"estimated_minutes" integer,
	"vehicle_class_ids" jsonb DEFAULT '[]' NOT NULL,
	"price_rules" jsonb DEFAULT '{}' NOT NULL,
	"operating_days" jsonb DEFAULT '[]' NOT NULL,
	"restrictions" jsonb DEFAULT '{}' NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "saved_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"label" text NOT NULL,
	"address" text NOT NULL,
	"location" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "shared_ride_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"shared_ride_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"booking_id" uuid,
	"status" "shared_ride_status" DEFAULT 'AVAILABLE'::"shared_ride_status" NOT NULL,
	"seats" integer DEFAULT 1 NOT NULL,
	"pickup" jsonb NOT NULL,
	"destination" jsonb NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "shared_rides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"city_id" uuid NOT NULL,
	"vehicle_class_id" uuid NOT NULL,
	"trip_id" uuid,
	"status" "shared_ride_status" DEFAULT 'MATCHING'::"shared_ride_status" NOT NULL,
	"max_passengers" integer DEFAULT 4 NOT NULL,
	"pickup_zone_id" uuid,
	"dropoff_zone_id" uuid,
	"route_data" jsonb DEFAULT '{}' NOT NULL,
	"rules_snapshot" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"starts_at" timestamp with time zone,
	"renews_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"payment_provider" text,
	"provider_reference" text,
	"benefit_snapshot" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"reference" text NOT NULL,
	"user_id" uuid NOT NULL,
	"category" text NOT NULL,
	"priority" text DEFAULT 'NORMAL' NOT NULL,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"assigned_agent_id" uuid,
	"conversation" jsonb DEFAULT '[]' NOT NULL,
	"resolution" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "trip_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"trip_id" uuid NOT NULL,
	"driver_id" uuid NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"latitude" numeric(10,7) NOT NULL,
	"longitude" numeric(10,7) NOT NULL,
	"accuracy_meters" numeric(8,2),
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_passengers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"trip_id" uuid NOT NULL,
	"booking_passenger_id" uuid,
	"pickup_sequence" integer,
	"dropoff_sequence" integer,
	"passenger_verification" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"booking_id" uuid NOT NULL,
	"driver_id" uuid,
	"vehicle_id" uuid,
	"status" "booking_status" DEFAULT 'CONFIRMED'::"booking_status" NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"actual_distance_km" numeric(10,2),
	"actual_duration_minutes" integer,
	"fare_snapshot" jsonb DEFAULT '{}' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"identity_id" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"full_name" text NOT NULL,
	"role" "user_role" DEFAULT 'customer'::"user_role" NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"marketing_consent" boolean DEFAULT false NOT NULL,
	"terms_accepted_at" timestamp with time zone,
	"privacy_accepted_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "vehicle_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"vehicle_id" uuid NOT NULL,
	"driver_id" uuid NOT NULL,
	"assigned_by" uuid,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "vehicle_classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"passenger_capacity" integer NOT NULL,
	"luggage_capacity" integer DEFAULT 0 NOT NULL,
	"shared_ride_eligible" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"attributes" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"vehicle_code" text NOT NULL,
	"vehicle_class_id" uuid NOT NULL,
	"city_id" uuid,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"year" integer NOT NULL,
	"plate_number" text NOT NULL,
	"vin" text,
	"fuel_type" "fuel_type" NOT NULL,
	"mileage_km" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'AVAILABLE' NOT NULL,
	"next_service_date" date,
	"insurance_expires_at" date,
	"registration_expires_at" date,
	"telemetry_provider" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "wallet_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"wallet_id" uuid NOT NULL,
	"balance_type" text NOT NULL,
	"transaction_type" text NOT NULL,
	"amount" numeric(14,2) NOT NULL,
	"reference" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"cash_balance" numeric(14,2) DEFAULT '0' NOT NULL,
	"promotional_balance" numeric(14,2) DEFAULT '0' NOT NULL,
	"membership_credit_balance" numeric(14,2) DEFAULT '0' NOT NULL,
	"reward_credit_balance" numeric(14,2) DEFAULT '0' NOT NULL,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "audit_target_idx" ON "audit_logs" ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "audit_actor_time_idx" ON "audit_logs" ("actor_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_reference_idx" ON "bookings" ("reference");--> statement-breakpoint
CREATE INDEX "bookings_user_status_idx" ON "bookings" ("booker_id","status");--> statement-breakpoint
CREATE INDEX "bookings_city_schedule_idx" ON "bookings" ("city_id","scheduled_at");--> statement-breakpoint
CREATE UNIQUE INDEX "cities_name_state_idx" ON "cities" ("name","state");--> statement-breakpoint
CREATE UNIQUE INDEX "corporate_member_idx" ON "corporate_members" ("corporate_account_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "coupon_code_idx" ON "coupons" ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_profiles_user_idx" ON "customer_profiles" ("user_id");--> statement-breakpoint
CREATE INDEX "documents_owner_idx" ON "documents" ("owner_type","owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "driver_profiles_user_idx" ON "driver_profiles" ("user_id");--> statement-breakpoint
CREATE INDEX "drivers_status_idx" ON "driver_profiles" ("chauffeur_status");--> statement-breakpoint
CREATE INDEX "incidents_status_priority_idx" ON "incidents" ("status","priority");--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_number_idx" ON "invoices" ("invoice_number");--> statement-breakpoint
CREATE UNIQUE INDEX "membership_benefit_key_idx" ON "membership_benefits" ("plan_id","benefit_key");--> statement-breakpoint
CREATE UNIQUE INDEX "membership_plans_code_idx" ON "membership_plans" ("code");--> statement-breakpoint
CREATE INDEX "zones_city_idx" ON "operating_zones" ("city_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_provider_reference_idx" ON "payments" ("provider","provider_reference");--> statement-breakpoint
CREATE INDEX "pricing_rules_lookup_idx" ON "pricing_rules" ("active","city_id","vehicle_class_id","priority");--> statement-breakpoint
CREATE UNIQUE INDEX "referral_code_idx" ON "referrals" ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "reward_accounts_user_idx" ON "reward_accounts" ("user_id");--> statement-breakpoint
CREATE INDEX "shared_participant_status_idx" ON "shared_ride_participants" ("status","available_at");--> statement-breakpoint
CREATE INDEX "shared_rides_matching_idx" ON "shared_rides" ("city_id","status","vehicle_class_id");--> statement-breakpoint
CREATE INDEX "subscriptions_user_status_idx" ON "subscriptions" ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "support_ticket_reference_idx" ON "support_tickets" ("reference");--> statement-breakpoint
CREATE INDEX "trip_locations_trip_time_idx" ON "trip_locations" ("trip_id","recorded_at");--> statement-breakpoint
CREATE INDEX "trips_status_idx" ON "trips" ("status");--> statement-breakpoint
CREATE INDEX "trips_driver_idx" ON "trips" ("driver_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_identity_id_idx" ON "users" ("identity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" ("role");--> statement-breakpoint
CREATE INDEX "assignments_vehicle_active_idx" ON "vehicle_assignments" ("vehicle_id","active");--> statement-breakpoint
CREATE INDEX "assignments_driver_active_idx" ON "vehicle_assignments" ("driver_id","active");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_classes_code_idx" ON "vehicle_classes" ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicles_code_idx" ON "vehicles" ("vehicle_code");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicles_plate_idx" ON "vehicles" ("plate_number");--> statement-breakpoint
CREATE INDEX "vehicles_status_city_idx" ON "vehicles" ("status","city_id");--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_transaction_reference_idx" ON "wallet_transactions" ("reference");--> statement-breakpoint
CREATE UNIQUE INDEX "wallets_user_idx" ON "wallets" ("user_id");--> statement-breakpoint
ALTER TABLE "airport_transfers" ADD CONSTRAINT "airport_transfers_booking_id_bookings_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id");--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "booking_passengers" ADD CONSTRAINT "booking_passengers_booking_id_bookings_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "booking_passengers" ADD CONSTRAINT "booking_passengers_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_booker_id_users_id_fkey" FOREIGN KEY ("booker_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_corporate_account_id_corporate_accounts_id_fkey" FOREIGN KEY ("corporate_account_id") REFERENCES "corporate_accounts"("id");--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_city_id_cities_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id");--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vehicle_class_id_vehicle_classes_id_fkey" FOREIGN KEY ("vehicle_class_id") REFERENCES "vehicle_classes"("id");--> statement-breakpoint
ALTER TABLE "charging_records" ADD CONSTRAINT "charging_records_vehicle_id_vehicles_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id");--> statement-breakpoint
ALTER TABLE "corporate_contracts" ADD CONSTRAINT "corporate_contracts_QeVPViXbZFgQ_fkey" FOREIGN KEY ("corporate_account_id") REFERENCES "corporate_accounts"("id");--> statement-breakpoint
ALTER TABLE "corporate_members" ADD CONSTRAINT "corporate_members_SY3sdH2kXZ5c_fkey" FOREIGN KEY ("corporate_account_id") REFERENCES "corporate_accounts"("id");--> statement-breakpoint
ALTER TABLE "corporate_members" ADD CONSTRAINT "corporate_members_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "corporate_members" ADD CONSTRAINT "corporate_members_department_id_departments_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id");--> statement-breakpoint
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_corporate_account_id_corporate_accounts_id_fkey" FOREIGN KEY ("corporate_account_id") REFERENCES "corporate_accounts"("id");--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_reviewed_by_users_id_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "driver_profiles" ADD CONSTRAINT "driver_profiles_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_corporate_account_id_corporate_accounts_id_fkey" FOREIGN KEY ("corporate_account_id") REFERENCES "corporate_accounts"("id");--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_client_user_id_users_id_fkey" FOREIGN KEY ("client_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "fuel_records" ADD CONSTRAINT "fuel_records_vehicle_id_vehicles_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id");--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_reporter_id_users_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_trip_id_trips_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id");--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_vehicle_id_vehicles_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id");--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_driver_id_driver_profiles_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "driver_profiles"("id");--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_booking_id_bookings_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id");--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_corporate_account_id_corporate_accounts_id_fkey" FOREIGN KEY ("corporate_account_id") REFERENCES "corporate_accounts"("id");--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_vehicle_id_vehicles_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id");--> statement-breakpoint
ALTER TABLE "membership_benefits" ADD CONSTRAINT "membership_benefits_plan_id_membership_plans_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "membership_plans"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "operating_zones" ADD CONSTRAINT "operating_zones_city_id_cities_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id");--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_payment_id_payments_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id");--> statement-breakpoint
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_city_id_cities_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id");--> statement-breakpoint
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_vehicle_class_id_vehicle_classes_id_fkey" FOREIGN KEY ("vehicle_class_id") REFERENCES "vehicle_classes"("id");--> statement-breakpoint
ALTER TABLE "pricing_zones" ADD CONSTRAINT "pricing_zones_city_id_cities_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id");--> statement-breakpoint
ALTER TABLE "recurring_bookings" ADD CONSTRAINT "recurring_bookings_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "recurring_bookings" ADD CONSTRAINT "recurring_bookings_pKeKz5aoIR6N_fkey" FOREIGN KEY ("corporate_account_id") REFERENCES "corporate_accounts"("id");--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_users_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_user_id_users_id_fkey" FOREIGN KEY ("referred_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "reward_accounts" ADD CONSTRAINT "reward_accounts_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "reward_transactions" ADD CONSTRAINT "reward_transactions_reward_account_id_reward_accounts_id_fkey" FOREIGN KEY ("reward_account_id") REFERENCES "reward_accounts"("id");--> statement-breakpoint
ALTER TABLE "routes" ADD CONSTRAINT "routes_origin_city_id_cities_id_fkey" FOREIGN KEY ("origin_city_id") REFERENCES "cities"("id");--> statement-breakpoint
ALTER TABLE "routes" ADD CONSTRAINT "routes_destination_city_id_cities_id_fkey" FOREIGN KEY ("destination_city_id") REFERENCES "cities"("id");--> statement-breakpoint
ALTER TABLE "saved_locations" ADD CONSTRAINT "saved_locations_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "shared_ride_participants" ADD CONSTRAINT "shared_ride_participants_shared_ride_id_shared_rides_id_fkey" FOREIGN KEY ("shared_ride_id") REFERENCES "shared_rides"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "shared_ride_participants" ADD CONSTRAINT "shared_ride_participants_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "shared_ride_participants" ADD CONSTRAINT "shared_ride_participants_booking_id_bookings_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id");--> statement-breakpoint
ALTER TABLE "shared_rides" ADD CONSTRAINT "shared_rides_city_id_cities_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id");--> statement-breakpoint
ALTER TABLE "shared_rides" ADD CONSTRAINT "shared_rides_vehicle_class_id_vehicle_classes_id_fkey" FOREIGN KEY ("vehicle_class_id") REFERENCES "vehicle_classes"("id");--> statement-breakpoint
ALTER TABLE "shared_rides" ADD CONSTRAINT "shared_rides_trip_id_trips_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id");--> statement-breakpoint
ALTER TABLE "shared_rides" ADD CONSTRAINT "shared_rides_pickup_zone_id_operating_zones_id_fkey" FOREIGN KEY ("pickup_zone_id") REFERENCES "operating_zones"("id");--> statement-breakpoint
ALTER TABLE "shared_rides" ADD CONSTRAINT "shared_rides_dropoff_zone_id_operating_zones_id_fkey" FOREIGN KEY ("dropoff_zone_id") REFERENCES "operating_zones"("id");--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_membership_plans_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "membership_plans"("id");--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_agent_id_users_id_fkey" FOREIGN KEY ("assigned_agent_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "trip_locations" ADD CONSTRAINT "trip_locations_trip_id_trips_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "trip_locations" ADD CONSTRAINT "trip_locations_driver_id_driver_profiles_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "driver_profiles"("id");--> statement-breakpoint
ALTER TABLE "trip_locations" ADD CONSTRAINT "trip_locations_vehicle_id_vehicles_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id");--> statement-breakpoint
ALTER TABLE "trip_passengers" ADD CONSTRAINT "trip_passengers_trip_id_trips_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "trip_passengers" ADD CONSTRAINT "trip_passengers_booking_passenger_id_booking_passengers_id_fkey" FOREIGN KEY ("booking_passenger_id") REFERENCES "booking_passengers"("id");--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_booking_id_bookings_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id");--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_driver_id_driver_profiles_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "driver_profiles"("id");--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_vehicle_id_vehicles_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id");--> statement-breakpoint
ALTER TABLE "vehicle_assignments" ADD CONSTRAINT "vehicle_assignments_vehicle_id_vehicles_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id");--> statement-breakpoint
ALTER TABLE "vehicle_assignments" ADD CONSTRAINT "vehicle_assignments_driver_id_driver_profiles_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "driver_profiles"("id");--> statement-breakpoint
ALTER TABLE "vehicle_assignments" ADD CONSTRAINT "vehicle_assignments_assigned_by_users_id_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_vehicle_class_id_vehicle_classes_id_fkey" FOREIGN KEY ("vehicle_class_id") REFERENCES "vehicle_classes"("id");--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_city_id_cities_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id");--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_wallets_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id");--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");