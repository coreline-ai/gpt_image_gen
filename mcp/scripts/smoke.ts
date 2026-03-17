import { createApp } from "../src/app.js";
import { env } from "../src/config/env.js";
import { prisma } from "../src/lib/prisma.js";
import { seedDemoData } from "../prisma/seed.js";

const app = createApp();
const tinyPngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Z0vQAAAAASUVORK5CYII=";

async function main() {
  await seedDemoData({ reset: true });

  const projectsResponse = await fetch(`${env.BASE_URL}/api/projects`);
  const projects = (await projectsResponse.json()) as Array<{ projectId: string }>;
  const firstProjectId = projects[0]?.projectId;

  if (!firstProjectId) {
    throw new Error("No seeded projects found");
  }

  const contextResponse = await fetch(`${env.BASE_URL}/api/project/${firstProjectId}/execution-context`);
  const context = (await contextResponse.json()) as { nextItem: { id: string } | null };

  if (!context.nextItem) {
    throw new Error("No pending project item found");
  }

  const uploadResponse = await fetch(`${env.BASE_URL}/api/upload-generated-image`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      projectId: firstProjectId,
      itemId: context.nextItem.id,
      fileBase64: tinyPngBase64,
      filename: "smoke-test.png",
      contentType: "image/png"
    })
  });

  if (!uploadResponse.ok) {
    throw new Error(`Upload failed with status ${uploadResponse.status}`);
  }

  const uploadResult = (await uploadResponse.json()) as { imageUrl: string };
  const imageResponse = await fetch(uploadResult.imageUrl);

  if (!imageResponse.ok) {
    throw new Error("Stored image is not publicly reachable");
  }

  if (!(imageResponse.headers.get("content-type") ?? "").startsWith("image/")) {
    throw new Error("Stored image is not served with an image content type");
  }

  console.log("Smoke test passed");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = app.listen(env.PORT, async () => {
    try {
      await main();
    } finally {
      server.close();
      await prisma.$disconnect();
    }
  });
}
