UPDATE "program"
SET "ctaHref" = '/programs/' || LOWER("degreeCode")
WHERE "cta" = 'View More'
   OR "ctaHref" = '/admission/requirements';
