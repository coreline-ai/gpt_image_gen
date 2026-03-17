import { LogLevel, ProjectStatus } from "../../generated/prisma/client.js";
import { prisma } from "./prisma.js";
import type { ProjectExecutionContext, ProjectSummary } from "./types.js";

function mapProjectStatus(status: ProjectStatus): "pending" | "in_progress" | "completed" | "failed" {
  return status;
}

export async function appendProjectLog(input: {
  projectId: string;
  projectItemId?: string;
  step: string;
  message: string;
  level?: LogLevel;
  metadata?: Record<string, unknown>;
}) {
  return prisma.projectLog.create({
    data: {
      projectId: input.projectId,
      projectItemId: input.projectItemId,
      step: input.step,
      message: input.message,
      level: input.level ?? LogLevel.info,
      metadataJson: input.metadata ? JSON.stringify(input.metadata) : undefined
    }
  });
}

export async function listActiveProjects(): Promise<ProjectSummary[]> {
  const projects = await prisma.project.findMany({
    orderBy: {
      updatedAt: "desc"
    },
    include: {
      items: {
        select: {
          status: true
        }
      }
    }
  });

  return projects.map((project) => ({
    projectId: project.id,
    name: project.name,
    slug: project.slug,
    description: project.description,
    status: mapProjectStatus(project.status),
    totalItems: project.items.length,
    completedItems: project.items.filter((item) => item.status === ProjectStatus.completed).length,
    updatedAt: project.updatedAt.toISOString()
  }));
}

export async function getProjectExecutionContext(projectId: string, itemId?: string): Promise<ProjectExecutionContext> {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: {
      items: {
        orderBy: {
          displayOrder: "asc"
        }
      }
    }
  });

  const selectedItem =
    (itemId
      ? project.items.find((item) => item.id === itemId)
      : project.items.find((item) => item.status === ProjectStatus.pending)) ?? null;

  await appendProjectLog({
    projectId,
    projectItemId: selectedItem?.id,
    step: "context_viewed",
    message: selectedItem
      ? `Execution context requested for item ${selectedItem.displayOrder}.`
      : "Execution context requested with no pending item available."
  });

  return {
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status
    },
    nextItem: selectedItem
      ? {
          id: selectedItem.id,
          title: selectedItem.title,
          prompt: selectedItem.prompt,
          displayOrder: selectedItem.displayOrder,
          status: selectedItem.status
        }
      : null,
    items: project.items.map((item) => ({
      id: item.id,
      title: item.title,
      prompt: item.prompt,
      status: item.status,
      displayOrder: item.displayOrder,
      imageUrl: item.imageUrl
    })),
    prompt: selectedItem?.prompt ?? null,
    uploadTarget: project.uploadTarget,
    storagePathTemplate: project.storagePathTemplate
  };
}

export async function recomputeProjectStatus(projectId: string) {
  const items = await prisma.projectItem.findMany({
    where: { projectId },
    select: {
      status: true
    }
  });

  const statuses = items.map((item) => item.status);
  let nextStatus: ProjectStatus = ProjectStatus.pending;

  if (statuses.some((status) => status === ProjectStatus.failed)) {
    nextStatus = ProjectStatus.failed;
  } else if (statuses.length > 0 && statuses.every((status) => status === ProjectStatus.completed)) {
    nextStatus = ProjectStatus.completed;
  } else if (statuses.some((status) => status === ProjectStatus.in_progress || status === ProjectStatus.completed)) {
    nextStatus = ProjectStatus.in_progress;
  }

  await prisma.project.update({
    where: { id: projectId },
    data: {
      status: nextStatus
    }
  });

  return nextStatus;
}

export async function getProjectDetail(projectId: string) {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: {
      items: {
        orderBy: {
          displayOrder: "asc"
        }
      },
      logs: {
        orderBy: {
          createdAt: "desc"
        },
        take: 50
      }
    }
  });

  const latestImage = project.items.find((item) => item.imageUrl);

  return {
    project: {
      id: project.id,
      name: project.name,
      slug: project.slug,
      description: project.description,
      status: project.status,
      uploadTarget: project.uploadTarget,
      storagePathTemplate: project.storagePathTemplate,
      totalItems: project.items.length,
      completedItems: project.items.filter((item) => item.status === ProjectStatus.completed).length,
      updatedAt: project.updatedAt.toISOString()
    },
    items: project.items.map((item) => ({
      id: item.id,
      title: item.title,
      prompt: item.prompt,
      status: item.status,
      displayOrder: item.displayOrder,
      imageUrl: item.imageUrl,
      assetPath: item.assetPath,
      filename: item.filename,
      errorMessage: item.errorMessage,
      uploadedAt: item.uploadedAt?.toISOString() ?? null
    })),
    logs: project.logs.map((log) => ({
      id: log.id,
      projectId: log.projectId,
      projectItemId: log.projectItemId,
      step: log.step,
      level: log.level,
      message: log.message,
      metadataJson: log.metadataJson,
      createdAt: log.createdAt.toISOString()
    })),
    latestImageUrl: latestImage?.imageUrl ?? null
  };
}

export async function listLogs(projectId?: string) {
  const logs = await prisma.projectLog.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: {
      createdAt: "desc"
    },
    take: 100
  });

  return logs.map((log) => ({
    id: log.id,
    projectId: log.projectId,
    projectItemId: log.projectItemId,
    step: log.step,
    level: log.level,
    message: log.message,
    metadataJson: log.metadataJson,
    createdAt: log.createdAt.toISOString()
  }));
}
