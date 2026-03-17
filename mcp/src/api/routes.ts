import path from "node:path";
import { promises as fs } from "node:fs";
import { NextFunction, Request, Response, Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { getProjectDetail, getProjectExecutionContext, listActiveProjects, listLogs } from "../lib/project-service.js";
import { uploadGeneratedImage } from "../lib/upload-service.js";
import { handleToolRequest } from "../mcp/tool-handlers.js";
import { env } from "../config/env.js";
import { inferStoredFileContentType } from "../storage/file-storage.js";

const uploadSchema = z.object({
  projectId: z.string().min(1),
  itemId: z.string().min(1),
  openaiFileIdRefs: z
    .array(
      z.object({
        name: z.string().optional(),
        mime_type: z.string().optional(),
        download_link: z.string().url().optional()
      })
    )
    .optional(),
  fileUrl: z.string().url().optional(),
  fileBase64: z.string().optional(),
  filename: z.string().optional(),
  contentType: z.string().optional()
});

export function createRouter() {
  const router = Router();

  router.get("/healthz", (_request, response) => {
    response.json({ ok: true });
  });

  router.get("/storage/items/:projectId/:filename", async (request, response, next) => {
    try {
      const { projectId, filename } = request.params;
      const item = await prisma.projectItem.findFirst({
        where: {
          projectId,
          filename
        },
        select: {
          contentType: true
        }
      });

      const filePath = path.join(env.STORAGE_ROOT, "items", projectId, filename);
      await fs.access(filePath);

      const inferredContentType = item?.contentType ?? (await inferStoredFileContentType(filePath)) ?? "application/octet-stream";
      response.type(inferredContentType);
      response.sendFile(filePath);
    } catch (error) {
      next(error);
    }
  });

  router.get("/api/projects", async (_request, response, next) => {
    try {
      response.json(await listActiveProjects());
    } catch (error) {
      next(error);
    }
  });

  router.get("/api/project/:id", async (request, response, next) => {
    try {
      response.json(await getProjectDetail(request.params.id));
    } catch (error) {
      next(error);
    }
  });

  router.get("/api/project/:id/execution-context", async (request, response, next) => {
    try {
      const itemId = typeof request.query.itemId === "string" ? request.query.itemId : undefined;
      response.json(await getProjectExecutionContext(request.params.id, itemId));
    } catch (error) {
      next(error);
    }
  });

  router.get("/api/logs", async (request, response, next) => {
    try {
      const projectId = typeof request.query.projectId === "string" ? request.query.projectId : undefined;
      response.json(await listLogs(projectId));
    } catch (error) {
      next(error);
    }
  });

  router.post("/api/upload-generated-image", async (request, response, next) => {
    try {
      const body = uploadSchema.parse(request.body);
      response.json(
        await uploadGeneratedImage({
          projectId: body.projectId,
          itemId: body.itemId,
          openaiFileIdRefs: body.openaiFileIdRefs,
          fileUrl: body.fileUrl,
          fileBase64: body.fileBase64,
          filename: body.filename,
          contentType: body.contentType
        })
      );
    } catch (error) {
      next(error);
    }
  });

  router.post("/mcp", async (request, response, next) => {
    try {
      response.json({
        result: await handleToolRequest(request.body)
      });
    } catch (error) {
      next(error);
    }
  });

  router.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    const message = error instanceof Error ? error.message : "Unexpected error";
    response.status(400).json({
      success: false,
      error: message
    });
  });

  return router;
}
