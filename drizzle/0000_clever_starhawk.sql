CREATE TABLE "predictions" (
	"user_id" integer NOT NULL,
	"match_id" integer NOT NULL,
	"resultado" char(1) NOT NULL,
	"goles_local" integer NOT NULL,
	"goles_visita" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "predictions_user_id_match_id_pk" PRIMARY KEY("user_id","match_id"),
	CONSTRAINT "resultado_check" CHECK (resultado IN ('L', 'E', 'V')),
	CONSTRAINT "goles_local_check" CHECK (goles_local >= 0 AND goles_local <= 15),
	CONSTRAINT "goles_visita_check" CHECK (goles_visita >= 0 AND goles_visita <= 15)
);
--> statement-breakpoint
CREATE TABLE "results" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer NOT NULL,
	"goles_local" integer NOT NULL,
	"goles_visita" integer NOT NULL,
	"video" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "results_match_id_unique" UNIQUE("match_id"),
	CONSTRAINT "results_goles_local_check" CHECK (goles_local >= 0 AND goles_local <= 15),
	CONSTRAINT "results_goles_visita_check" CHECK (goles_visita >= 0 AND goles_visita <= 15)
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"token" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_sessions_user" ON "sessions" USING btree ("user_id");