import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

function resolveDatabasePath(databaseUrl: string) {
  if (!databaseUrl.startsWith("file:")) {
    throw new Error(`Unsupported DATABASE_URL for MVP SQLite setup: ${databaseUrl}`);
  }

  const relativePath = databaseUrl.replace(/^file:/, "");
  return path.resolve(process.cwd(), relativePath);
}

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const databasePath = resolveDatabasePath(databaseUrl);

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const db = new Database(databasePath);
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "uploadTarget" TEXT NOT NULL,
    "storagePathTemplate" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS "ProjectItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "displayOrder" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "assetPath" TEXT,
    "filename" TEXT,
    "contentType" TEXT,
    "errorMessage" TEXT,
    "uploadedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );

  CREATE TABLE IF NOT EXISTS "ProjectLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "projectItemId" TEXT,
    "step" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'info',
    "message" TEXT NOT NULL,
    "metadataJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectLog_projectItemId_fkey" FOREIGN KEY ("projectItemId") REFERENCES "ProjectItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  );

  CREATE UNIQUE INDEX IF NOT EXISTS "ProjectItem_projectId_displayOrder_key" ON "ProjectItem"("projectId", "displayOrder");
`);

db.close();

console.log(`SQLite schema ensured at ${databasePath}`);
