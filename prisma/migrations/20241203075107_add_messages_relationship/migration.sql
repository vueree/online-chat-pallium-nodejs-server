ALTER TABLE "Message" DROP COLUMN "content",
ADD COLUMN "message" TEXT NOT NULL DEFAULT '';

ALTER TABLE "User" ADD COLUMN "password" TEXT NOT NULL DEFAULT '';

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

ALTER TABLE "Message" ALTER COLUMN "message" SET DEFAULT '';

ALTER TABLE "User" ALTER COLUMN "password" SET DEFAULT '';
