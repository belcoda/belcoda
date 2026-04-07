CREATE TABLE "whatsapp_log" (
	"id" uuid PRIMARY KEY NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
