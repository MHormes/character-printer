ALTER TABLE `class_features` ADD `subclass_id` text REFERENCES `subclasses`(`id`) ON DELETE CASCADE;
