UPDATE "faculty"
SET "phone" = '0' || "phone"
WHERE "phone" ~ '^[1-9][0-9]{9}$';
