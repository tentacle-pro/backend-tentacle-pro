CREATE TABLE "client_injections" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"position" text NOT NULL,
	"html" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "client_injections" ADD CONSTRAINT "client_injections_client_id_api_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."api_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "client_injections_client_position_idx" ON "client_injections" USING btree ("client_id","position");
