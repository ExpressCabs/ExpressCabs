ALTER TABLE "Blog"
ADD COLUMN     "metaTitle" TEXT,
ADD COLUMN     "metaDescription" TEXT,
ADD COLUMN     "excerpt" TEXT,
ADD COLUMN     "ogImage" TEXT,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3),
ADD COLUMN     "authorName" TEXT,
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "readingTimeMinutes" INTEGER,
ADD COLUMN     "keywords" TEXT,
ADD COLUMN     "faqJson" JSONB;

UPDATE "Blog"
SET
  "metaTitle" = COALESCE("metaTitle", "title"),
  "metaDescription" = COALESCE("metaDescription", "subtitle", LEFT("body1", 160)),
  "excerpt" = COALESCE("excerpt", "subtitle", LEFT("body1", 160)),
  "ogImage" = COALESCE("ogImage", "image1"),
  "publishedAt" = COALESCE("publishedAt", "createdAt"),
  "updatedAt" = COALESCE("updatedAt", "createdAt"),
  "authorName" = COALESCE("authorName", 'Prime Cabs Melbourne');
