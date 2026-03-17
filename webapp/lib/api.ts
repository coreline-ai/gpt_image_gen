export type ProjectSummary = {
  projectId: string;
  name: string;
  slug: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  totalItems: number;
  completedItems: number;
  updatedAt: string;
};

export type ProjectDetail = {
  project: {
    id: string;
    name: string;
    slug: string;
    description: string;
    status: "pending" | "in_progress" | "completed" | "failed";
    uploadTarget: string;
    storagePathTemplate: string;
    totalItems: number;
    completedItems: number;
    updatedAt: string;
  };
  items: Array<{
    id: string;
    title: string;
    prompt: string;
    status: "pending" | "in_progress" | "completed" | "failed";
    displayOrder: number;
    imageUrl: string | null;
    assetPath: string | null;
    filename: string | null;
    errorMessage: string | null;
    uploadedAt: string | null;
  }>;
  logs: Array<{
    id: string;
    step: string;
    level: "info" | "error";
    message: string;
    createdAt: string;
  }>;
  latestImageUrl: string | null;
};

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
}

async function requestJson<T>(path: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`API request failed for ${path}`);
  }

  return response.json() as Promise<T>;
}

export function getProjects() {
  return requestJson<ProjectSummary[]>("/api/projects");
}

export function getProject(projectId: string) {
  return requestJson<ProjectDetail>(`/api/project/${projectId}`);
}

export function calculateProgress(totalItems: number, completedItems: number) {
  if (totalItems === 0) {
    return 0;
  }

  return Math.round((completedItems / totalItems) * 100);
}

export function resolveAssetUrl(input: { assetPath: string | null; imageUrl: string | null }) {
  if (input.assetPath) {
    if (input.assetPath.startsWith("http://") || input.assetPath.startsWith("https://")) {
      return input.assetPath;
    }

    return `${getApiBaseUrl()}${input.assetPath}`;
  }

  return input.imageUrl;
}
