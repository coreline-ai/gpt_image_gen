import path from "node:path";
import { LogLevel, ProjectStatus } from "../../generated/prisma/client.js";
import { prisma } from "./prisma.js";
import { appendProjectLog, recomputeProjectStatus } from "./project-service.js";
import { saveProjectImage } from "../storage/file-storage.js";
import type { UploadFileReference, UploadResult } from "./types.js";

async function bufferFromRemoteUrl(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Remote file download failed with status ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType: response.headers.get("content-type") ?? "image/png"
  };
}

function bufferFromBase64(value: string) {
  return Buffer.from(value, "base64");
}

function resolvePrimaryFileRef(openaiFileIdRefs?: UploadFileReference[]) {
  return openaiFileIdRefs?.find((reference) => Boolean(reference.download_link)) ?? null;
}

export async function uploadGeneratedImage(input: {
  projectId: string;
  itemId: string;
  openaiFileIdRefs?: UploadFileReference[];
  fileUrl?: string;
  fileBase64?: string;
  filename?: string;
  contentType?: string;
}): Promise<UploadResult> {
  const item = await prisma.projectItem.findUniqueOrThrow({
    where: { id: input.itemId },
    include: {
      project: true
    }
  });

  if (item.projectId !== input.projectId) {
    throw new Error("Project/item mismatch");
  }

  await prisma.projectItem.update({
    where: { id: input.itemId },
    data: {
      status: ProjectStatus.in_progress,
      errorMessage: null
    }
  });

  await appendProjectLog({
    projectId: input.projectId,
    projectItemId: input.itemId,
    step: "upload_started",
    message: "Image upload started."
  });

  try {
    const fileRef = resolvePrimaryFileRef(input.openaiFileIdRefs);
    let fileBuffer: Buffer;
    let resolvedContentType = input.contentType ?? fileRef?.mime_type ?? "image/png";
    const resolvedFilename = input.filename ?? fileRef?.name ?? `${input.itemId}.png`;

    if (fileRef?.download_link) {
      const remote = await bufferFromRemoteUrl(fileRef.download_link);
      fileBuffer = remote.buffer;
      resolvedContentType = remote.contentType;
    } else if (input.fileUrl) {
      const remote = await bufferFromRemoteUrl(input.fileUrl);
      fileBuffer = remote.buffer;
      resolvedContentType = remote.contentType;
    } else if (input.fileBase64) {
      fileBuffer = bufferFromBase64(input.fileBase64);
    } else {
      throw new Error("No upload payload provided");
    }

    const saved = await saveProjectImage({
      projectId: input.projectId,
      itemId: input.itemId,
      buffer: fileBuffer,
      originalName: path.basename(resolvedFilename),
      contentType: resolvedContentType
    });

    await prisma.projectItem.update({
      where: { id: input.itemId },
      data: {
        status: ProjectStatus.completed,
        imageUrl: saved.imageUrl,
        assetPath: saved.assetPath,
        filename: saved.filename,
        contentType: saved.contentType,
        uploadedAt: new Date(),
        errorMessage: null
      }
    });

    const projectStatus = await recomputeProjectStatus(input.projectId);

    await appendProjectLog({
      projectId: input.projectId,
      projectItemId: input.itemId,
      step: "upload_completed",
      message: `Image uploaded to ${saved.assetPath}.`,
      metadata: {
        imageUrl: saved.imageUrl
      }
    });

    return {
      success: true,
      projectId: input.projectId,
      itemId: input.itemId,
      filename: saved.filename,
      assetPath: saved.assetPath,
      imageUrl: saved.imageUrl,
      status: projectStatus
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown upload error";

    await prisma.projectItem.update({
      where: { id: input.itemId },
      data: {
        status: ProjectStatus.failed,
        errorMessage: message
      }
    });

    await recomputeProjectStatus(input.projectId);

    await appendProjectLog({
      projectId: input.projectId,
      projectItemId: input.itemId,
      step: "upload_failed",
      level: LogLevel.error,
      message,
      metadata: {
        itemId: input.itemId
      }
    });

    throw error;
  }
}
