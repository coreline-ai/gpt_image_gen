import fs from "node:fs/promises";
import path from "node:path";
import { ProjectStatus } from "../generated/prisma/client.js";
import { prisma } from "../src/lib/prisma.js";
import { env } from "../src/config/env.js";
import { appendProjectLog, recomputeProjectStatus } from "../src/lib/project-service.js";
import { inferStoredFileContentType } from "../src/storage/file-storage.js";

const projectId = "604067c7-5a5e-4739-80ae-23c12347e66e";

function extractTimestamp(fileName: string) {
  const match = fileName.match(/-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)/);
  return match?.[1] ?? "";
}

function normalizeTimestamp(embeddedTimestamp: string) {
  if (!embeddedTimestamp) {
    return new Date().toISOString();
  }

  return embeddedTimestamp.replace(/^(\d{4}-\d{2}-\d{2}T\d{2})-(\d{2})-(\d{2})-(\d{3}Z)$/, "$1:$2:$3.$4");
}

function extensionFromMime(mimeType: string | null) {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "png";
  }
}

async function main() {
  const items = await prisma.projectItem.findMany({
    where: { projectId },
    orderBy: { displayOrder: "asc" }
  });

  const projectStorageDir = path.join(env.STORAGE_ROOT, "items", projectId);
  const files = await fs.readdir(projectStorageDir);
  const candidateFiles = files
    .filter((file) => file.includes(".dalle-"))
    .filter((file) => Boolean(extractTimestamp(file)))
    .sort((left, right) => extractTimestamp(left).localeCompare(extractTimestamp(right)));

  if (candidateFiles.length < items.length) {
    throw new Error(`Not enough recoverable files found. Expected at least ${items.length}, got ${candidateFiles.length}.`);
  }

  const selectedFiles = candidateFiles.slice(0, items.length);

  for (const [index, item] of items.entries()) {
    const sourceFilename = selectedFiles[index];
    const sourcePath = path.join(projectStorageDir, sourceFilename);
    const mimeType = (await inferStoredFileContentType(sourcePath)) ?? "image/png";
    const extension = extensionFromMime(mimeType);
    const embeddedTimestamp = extractTimestamp(sourceFilename);
    const restoredFilename = `${item.id}-${embeddedTimestamp || new Date().toISOString().replace(/[:.]/g, "-")}.${extension}`;
    const restoredPath = path.join(projectStorageDir, restoredFilename);

    await fs.copyFile(sourcePath, restoredPath);

    await prisma.projectItem.update({
      where: { id: item.id },
      data: {
        status: ProjectStatus.completed,
        filename: restoredFilename,
        assetPath: `/storage/items/${projectId}/${restoredFilename}`,
        imageUrl: `${env.BASE_URL}/storage/items/${projectId}/${restoredFilename}`,
        contentType: mimeType,
        errorMessage: null,
        uploadedAt: new Date(normalizeTimestamp(embeddedTimestamp))
      }
    });

    await appendProjectLog({
      projectId,
      projectItemId: item.id,
      step: "storage_recovered",
      message: `Recovered ${sourceFilename} into ${restoredFilename}.`,
      metadata: {
        sourceFilename,
        restoredFilename
      }
    });
  }

  await recomputeProjectStatus(projectId);

  console.log(`Recovered ${items.length} project items from storage for project ${projectId}.`);
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
