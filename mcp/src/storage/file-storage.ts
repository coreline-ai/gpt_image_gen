import fs from "node:fs/promises";
import path from "node:path";
import { fileTypeFromBuffer, fileTypeFromFile } from "file-type";
import { env } from "../config/env.js";

export async function ensureStorageDirectory(projectId: string) {
  const directory = path.join(env.STORAGE_ROOT, "items", projectId);
  await fs.mkdir(directory, { recursive: true });
  return directory;
}

const mimeToExtension: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg"
};

function normalizeExtension(value?: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/^\./, "").toLowerCase();
  return ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(normalized) ? normalized : null;
}

function extractKnownExtension(originalName?: string) {
  if (!originalName) {
    return null;
  }

  const parts = originalName.toLowerCase().split(".");
  for (let index = parts.length - 1; index >= 0; index -= 1) {
    const extension = normalizeExtension(parts[index]);
    if (extension) {
      return extension === "jpeg" ? "jpg" : extension;
    }
  }

  return null;
}

export async function inferImageMetadata(input: {
  buffer: Buffer;
  originalName?: string;
  contentType?: string;
}) {
  const detected = await fileTypeFromBuffer(input.buffer);
  const detectedMime = detected?.mime ?? null;
  const detectedExtension = normalizeExtension(detected?.ext) ?? null;
  const contentTypeExtension = normalizeExtension(mimeToExtension[input.contentType ?? ""]);
  const filenameExtension = extractKnownExtension(input.originalName);
  const extension = detectedExtension ?? contentTypeExtension ?? filenameExtension ?? "png";
  const mimeType = detectedMime ?? input.contentType ?? `image/${extension === "jpg" ? "jpeg" : extension}`;

  return {
    extension,
    mimeType
  };
}

export function buildStorageFilename(itemId: string, extension: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${itemId}-${timestamp}.${extension}`;
}

export async function saveProjectImage(input: {
  projectId: string;
  itemId: string;
  buffer: Buffer;
  originalName?: string;
  contentType?: string;
}) {
  const directory = await ensureStorageDirectory(input.projectId);
  const metadata = await inferImageMetadata({
    buffer: input.buffer,
    originalName: input.originalName,
    contentType: input.contentType
  });
  const filename = buildStorageFilename(input.itemId, metadata.extension);
  const filePath = path.join(directory, filename);

  await fs.writeFile(filePath, input.buffer);

  return {
    filename,
    filePath,
    contentType: metadata.mimeType,
    assetPath: `/storage/items/${input.projectId}/${filename}`,
    imageUrl: `${env.BASE_URL}/storage/items/${input.projectId}/${filename}`
  };
}

export async function inferStoredFileContentType(filePath: string) {
  const detected = await fileTypeFromFile(filePath);
  return detected?.mime ?? null;
}
