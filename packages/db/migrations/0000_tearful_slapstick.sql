CREATE TABLE "api_clients" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"api_key_hash" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"plan" text DEFAULT 'free',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_account_bindings" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"wechat_account_id" text NOT NULL,
	"permission_scope" text DEFAULT 'full' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "publish_audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"client_id" text,
	"endpoint" text NOT NULL,
	"method" text NOT NULL,
	"payload_digest" text,
	"result_status" integer NOT NULL,
	"error_code" text,
	"latency_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "render_assets" (
	"id" text PRIMARY KEY NOT NULL,
	"alias" text NOT NULL,
	"filename" text NOT NULL,
	"original_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"url" text NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"config" jsonb NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wechat_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"app_id" text NOT NULL,
	"app_secret_encrypted" text NOT NULL,
	"account_name" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wechat_accounts_app_id_unique" UNIQUE("app_id")
);
--> statement-breakpoint
CREATE TABLE "wechat_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"wechat_account_id" text NOT NULL,
	"access_token_encrypted" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"refreshed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "wechat_tokens_wechat_account_id_unique" UNIQUE("wechat_account_id")
);
--> statement-breakpoint
ALTER TABLE "client_account_bindings" ADD CONSTRAINT "client_account_bindings_client_id_api_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."api_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_account_bindings" ADD CONSTRAINT "client_account_bindings_wechat_account_id_wechat_accounts_id_fk" FOREIGN KEY ("wechat_account_id") REFERENCES "public"."wechat_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wechat_tokens" ADD CONSTRAINT "wechat_tokens_wechat_account_id_wechat_accounts_id_fk" FOREIGN KEY ("wechat_account_id") REFERENCES "public"."wechat_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "api_clients_api_key_hash_idx" ON "api_clients" USING btree ("api_key_hash");--> statement-breakpoint
CREATE INDEX "publish_audit_logs_client_created_idx" ON "publish_audit_logs" USING btree ("client_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "render_assets_alias_idx" ON "render_assets" USING btree ("alias");--> statement-breakpoint
CREATE UNIQUE INDEX "render_assets_filename_idx" ON "render_assets" USING btree ("filename");--> statement-breakpoint
CREATE INDEX "wechat_tokens_account_expires_idx" ON "wechat_tokens" USING btree ("wechat_account_id","expires_at");