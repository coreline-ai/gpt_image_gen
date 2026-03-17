import { z } from "zod";
import { appendProjectLog, getProjectExecutionContext, listActiveProjects } from "../lib/project-service.js";
import { uploadGeneratedImage } from "../lib/upload-service.js";

const ToolRequestSchema = z.object({
  tool: z.enum(["list_active_projects", "get_project_execution_context", "upload_generated_image", "append_project_log"]),
  arguments: z.record(z.any()).optional()
});

export type ToolRequest = z.infer<typeof ToolRequestSchema>;

export async function handleToolRequest(payload: unknown) {
  const request = ToolRequestSchema.parse(payload);

  switch (request.tool) {
    case "list_active_projects":
      return listActiveProjects();
    case "get_project_execution_context":
      return getProjectExecutionContext(
        z.string().parse(request.arguments?.projectId),
        request.arguments?.itemId ? z.string().parse(request.arguments.itemId) : undefined
      );
    case "upload_generated_image":
      return uploadGeneratedImage({
        projectId: z.string().parse(request.arguments?.projectId),
        itemId: z.string().parse(request.arguments?.itemId),
        openaiFileIdRefs: request.arguments?.openaiFileIdRefs as never,
        fileUrl: request.arguments?.fileUrl ? z.string().parse(request.arguments.fileUrl) : undefined,
        fileBase64: request.arguments?.fileBase64 ? z.string().parse(request.arguments.fileBase64) : undefined,
        filename: request.arguments?.filename ? z.string().parse(request.arguments.filename) : undefined,
        contentType: request.arguments?.contentType ? z.string().parse(request.arguments.contentType) : undefined
      });
    case "append_project_log":
      return appendProjectLog({
        projectId: z.string().parse(request.arguments?.projectId),
        projectItemId: request.arguments?.projectItemId ? z.string().parse(request.arguments.projectItemId) : undefined,
        step: z.string().parse(request.arguments?.step),
        message: z.string().parse(request.arguments?.message)
      });
  }
}
