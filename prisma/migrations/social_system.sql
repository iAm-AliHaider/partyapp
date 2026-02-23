-- Social System Migration
-- Run this against Neon DB manually

-- Enums
DO $$ BEGIN
  CREATE TYPE "PostType" AS ENUM ('TEXT', 'PHOTO', 'VIDEO', 'SHARED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "PostVisibility" AS ENUM ('PUBLIC', 'FRIENDS', 'DISTRICT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "FriendshipStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Posts
CREATE TABLE IF NOT EXISTS "posts" (
  "id" TEXT NOT NULL,
  "author_id" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "media_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "post_type" "PostType" NOT NULL DEFAULT 'TEXT',
  "visibility" "PostVisibility" NOT NULL DEFAULT 'PUBLIC',
  "likes_count" INTEGER NOT NULL DEFAULT 0,
  "comments_count" INTEGER NOT NULL DEFAULT 0,
  "shares_count" INTEGER NOT NULL DEFAULT 0,
  "shared_post_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- Comments
CREATE TABLE IF NOT EXISTS "comments" (
  "id" TEXT NOT NULL,
  "post_id" TEXT NOT NULL,
  "author_id" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "likes_count" INTEGER NOT NULL DEFAULT 0,
  "parent_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- Post Likes
CREATE TABLE IF NOT EXISTS "post_likes" (
  "id" TEXT NOT NULL,
  "post_id" TEXT NOT NULL,
  "member_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "post_likes_pkey" PRIMARY KEY ("id")
);

-- Comment Likes
CREATE TABLE IF NOT EXISTS "comment_likes" (
  "id" TEXT NOT NULL,
  "comment_id" TEXT NOT NULL,
  "member_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "comment_likes_pkey" PRIMARY KEY ("id")
);

-- Friendships
CREATE TABLE IF NOT EXISTS "friendships" (
  "id" TEXT NOT NULL,
  "requester_id" TEXT NOT NULL,
  "addressee_id" TEXT NOT NULL,
  "status" "FriendshipStatus" NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "friendships_pkey" PRIMARY KEY ("id")
);

-- Foreign Keys
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "posts" ADD CONSTRAINT "posts_shared_post_id_fkey" FOREIGN KEY ("shared_post_id") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "friendships" ADD CONSTRAINT "friendships_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_addressee_id_fkey" FOREIGN KEY ("addressee_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Unique Constraints
CREATE UNIQUE INDEX IF NOT EXISTS "post_likes_post_id_member_id_key" ON "post_likes"("post_id", "member_id");
CREATE UNIQUE INDEX IF NOT EXISTS "comment_likes_comment_id_member_id_key" ON "comment_likes"("comment_id", "member_id");
CREATE UNIQUE INDEX IF NOT EXISTS "friendships_requester_id_addressee_id_key" ON "friendships"("requester_id", "addressee_id");

-- Performance Indexes
CREATE INDEX IF NOT EXISTS "posts_author_id_created_at_idx" ON "posts"("author_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "comments_post_id_created_at_idx" ON "comments"("post_id", "created_at");
CREATE INDEX IF NOT EXISTS "friendships_addressee_id_status_idx" ON "friendships"("addressee_id", "status");
