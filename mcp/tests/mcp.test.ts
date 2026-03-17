process.env.DATABASE_URL = "file:./test.db";
process.env.BASE_URL = "http://localhost:3000";
process.env.STORAGE_ROOT = "./storage-test";

import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { env } from "../src/config/env.js";
import { prisma } from "../src/lib/prisma.js";
import { seedDemoData } from "../prisma/seed.js";

const app = createApp();
const tinyPngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Z0vQAAAAASUVORK5CYII=";

async function resetDb() {
  await seedDemoData({ reset: true });
}

beforeAll(async () => {
  // storage directory is created by the upload service
});

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("mcp server", () => {
  it("lists active projects", async () => {
    const response = await request(app).get("/api/projects");
    expect(response.status).toBe(200);
    expect(response.body[0]).toMatchObject({
      name: "Spring Launch Emoji Pack",
      totalItems: 24
    });
  });

  it("returns execution context for the next pending item", async () => {
    const project = await prisma.project.findFirstOrThrow();
    const response = await request(app).get(`/api/project/${project.id}/execution-context`);
    expect(response.status).toBe(200);
    expect(response.body.nextItem.prompt).toContain("Create");
    expect(response.body.uploadTarget).toContain("/api/upload-generated-image");
  });

  it("uploads a generated image and serves it from storage", async () => {
    const project = await prisma.project.findFirstOrThrow({
      include: { items: { orderBy: { displayOrder: "asc" } } }
    });

    const uploadResponse = await request(app).post("/api/upload-generated-image").send({
      projectId: project.id,
      itemId: project.items[0].id,
      fileBase64: tinyPngBase64,
      filename: "test-image.png",
      contentType: "image/png"
    });

    expect(uploadResponse.status).toBe(200);
    expect(uploadResponse.body.success).toBe(true);
    expect(uploadResponse.body.imageUrl).toContain("/storage/items/");
    expect(uploadResponse.body.filename.endsWith(".png")).toBe(true);

    const storedPath = uploadResponse.body.assetPath;
    const staticResponse = await request(app).get(storedPath);
    expect(staticResponse.status).toBe(200);
    expect(staticResponse.headers["content-type"]).toContain("image/png");
  });

  it("serves legacy files with broken extensions as images", async () => {
    const project = await prisma.project.findFirstOrThrow({
      include: { items: { orderBy: { displayOrder: "asc" } } }
    });

    const uploadResponse = await request(app).post("/api/upload-generated-image").send({
      projectId: project.id,
      itemId: project.items[0].id,
      fileBase64: tinyPngBase64,
      filename: "legacy-file.dalle-12345",
      contentType: "image/png"
    });

    expect(uploadResponse.status).toBe(200);
    expect(uploadResponse.body.filename.endsWith(".png")).toBe(true);

    await prisma.projectItem.update({
      where: { id: project.items[0].id },
      data: {
        filename: "legacy-file.dalle-12345",
        assetPath: `/storage/items/${project.id}/legacy-file.dalle-12345`,
        imageUrl: `http://localhost:3000/storage/items/${project.id}/legacy-file.dalle-12345`,
        contentType: null
      }
    });

    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const oldPath = path.resolve(env.STORAGE_ROOT, "items", project.id, uploadResponse.body.filename);
    const legacyPath = path.resolve(env.STORAGE_ROOT, "items", project.id, "legacy-file.dalle-12345");
    await fs.rename(oldPath, legacyPath);

    const legacyResponse = await request(app).get(`/storage/items/${project.id}/legacy-file.dalle-12345`);
    expect(legacyResponse.status).toBe(200);
    expect(legacyResponse.headers["content-type"]).toContain("image/png");
  });

  it("fails gracefully when upload payload is missing", async () => {
    const project = await prisma.project.findFirstOrThrow({
      include: { items: { orderBy: { displayOrder: "asc" } } }
    });

    const response = await request(app).post("/api/upload-generated-image").send({
      projectId: project.id,
      itemId: project.items[0].id
    });

    expect(response.status).toBe(400);
    const item = await prisma.projectItem.findUniqueOrThrow({ where: { id: project.items[0].id } });
    expect(item.status).toBe("failed");
  });

  it("handles MCP tool calls", async () => {
    const response = await request(app).post("/mcp").send({
      tool: "list_active_projects",
      arguments: {}
    });

    expect(response.status).toBe(200);
    expect(response.body.result).toHaveLength(1);
  });
});
