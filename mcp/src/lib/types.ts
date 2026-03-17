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

export type ProjectExecutionContext = {
  project: {
    id: string;
    name: string;
    description: string;
    status: string;
  };
  nextItem: {
    id: string;
    title: string;
    prompt: string;
    displayOrder: number;
    status: string;
  } | null;
  items: Array<{
    id: string;
    title: string;
    prompt: string;
    status: string;
    displayOrder: number;
    imageUrl: string | null;
  }>;
  prompt: string | null;
  uploadTarget: string;
  storagePathTemplate: string;
};

export type UploadFileReference = {
  name?: string;
  mime_type?: string;
  download_link?: string;
};

export type UploadResult = {
  success: boolean;
  projectId: string;
  itemId: string;
  filename: string;
  assetPath: string;
  imageUrl: string;
  status: string;
};
