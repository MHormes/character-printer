ALTER TABLE "class_features" ADD COLUMN "subclass_id" varchar(100) REFERENCES "subclasses"("id") ON DELETE CASCADE;
