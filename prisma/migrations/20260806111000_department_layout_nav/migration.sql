-- Add the new About link to existing installations without duplicating it.
INSERT INTO "main_nav_item" (
    "id", "groupId", "name", "href", "isExternal", "isDisabled",
    "displayOrder", "createdAt", "updatedAt"
)
SELECT
    'department-layout-nav', "id", 'Department Layout', '/about/department-layout',
    false, false, COALESCE((SELECT MAX("displayOrder") + 1 FROM "main_nav_item" WHERE "groupId" = "main_nav_group"."id"), 1),
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "main_nav_group"
WHERE "name" = 'About'
  AND NOT EXISTS (
    SELECT 1 FROM "main_nav_item" WHERE "href" = '/about/department-layout'
  );
