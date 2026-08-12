CREATE TABLE "person_note_mention" (
	"id" uuid PRIMARY KEY NOT NULL,
	"person_note_id" uuid NOT NULL,
	"mentioned_user_id" uuid NOT NULL,
	"start_index" integer NOT NULL,
	"length" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "person_note_mention_position_unique" UNIQUE("person_note_id","start_index"),
	CONSTRAINT "person_note_mention_start_index_check" CHECK ("person_note_mention"."start_index" >= 0),
	CONSTRAINT "person_note_mention_length_check" CHECK ("person_note_mention"."length" > 0)
);
--> statement-breakpoint
ALTER TABLE "person_note_mention" ADD CONSTRAINT "person_note_mention_person_note_id_person_note_id_fk" FOREIGN KEY ("person_note_id") REFERENCES "public"."person_note"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_note_mention" ADD CONSTRAINT "person_note_mention_mentioned_user_id_user_id_fk" FOREIGN KEY ("mentioned_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "person_note_mention_user_note_idx" ON "person_note_mention" USING btree ("mentioned_user_id","person_note_id");