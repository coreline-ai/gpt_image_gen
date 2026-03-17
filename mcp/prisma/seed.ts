import { ProjectStatus } from "../generated/prisma/client.js";
import { prisma } from "../src/lib/prisma.js";

const projectSlug = "spring-launch-emojis";
const projectId = "604067c7-5a5e-4739-80ae-23c12347e66e";

const prompts = [
  "Create a glossy cat emoji hugging a red heart, sticker pack style, white background.",
  "Create a smiling laptop mascot giving a thumbs up, sticker pack style, white background.",
  "Create a stack of gold coins with a money bag, playful emoji sticker style.",
  "Create a cheerful rocket taking off with a flame trail, emoji sticker style.",
  "Create a round yellow OK face giving a thumbs up, bold outlined sticker.",
  "Create a rabbit mascot holding a heart, cute sticker pack style.",
  "Create a treasure chest with sparkles and coins, emoji sticker style.",
  "Create a laughing tears emoji with bold blue tears, sticker pack style.",
  "Create a bright light bulb character smiling, emoji sticker style.",
  "Create a huge laughing emoji with tears, dynamic sticker style.",
  "Create a coffee cup mascot with steam and takeaway cup, sticker pack style.",
  "Create a pair of hands holding a pink sparkling heart, emoji sticker style.",
  "Create a rocket with the word START, colorful sticker style.",
  "Create a cool bear wearing sunglasses holding coffee, emoji sticker style.",
  "Create a SALE laptop with discount tags, sticker pack style.",
  "Create a unicorn mascot with confetti and magic wand, emoji sticker style.",
  "Create a surprised big eyes emoji, glossy sticker style.",
  "Create a trophy cup with stars and celebration confetti, sticker pack style.",
  "Create a friendly robot mascot waving, emoji sticker style.",
  "Create a wrapped gift box with sale tag, emoji sticker style.",
  "Create a WOW comic text burst, colorful sticker style.",
  "Create a sleepy laptop mascot with zzz icon, emoji sticker style.",
  "Create a big thumbs up hand with sparkles, sticker pack style.",
  "Create a paper airplane mail icon flying upward, emoji sticker style."
];

export async function seedDemoData(options?: { reset?: boolean }) {
  const reset = options?.reset ?? false;

  if (reset) {
    await prisma.projectLog.deleteMany();
    await prisma.projectItem.deleteMany();
    await prisma.project.deleteMany();
  }

  const project = await prisma.project.upsert({
    where: {
      id: projectId
    },
    update: {
      slug: projectSlug,
      name: "Spring Launch Emoji Pack",
      description:
        "Generate a 24-item emoji sticker pack for the spring launch campaign and upload each completed image to the local WebApp storage endpoint.",
      uploadTarget: "http://localhost:3000/api/upload-generated-image",
      storagePathTemplate: "/storage/items/{projectId}/{itemId}-{timestamp}.png"
    },
    create: {
      id: projectId,
      slug: projectSlug,
      name: "Spring Launch Emoji Pack",
      description:
        "Generate a 24-item emoji sticker pack for the spring launch campaign and upload each completed image to the local WebApp storage endpoint.",
      status: ProjectStatus.pending,
      uploadTarget: "http://localhost:3000/api/upload-generated-image",
      storagePathTemplate: "/storage/items/{projectId}/{itemId}-{timestamp}.png"
    }
  });

  for (const [index, prompt] of prompts.entries()) {
    await prisma.projectItem.upsert({
      where: {
        id: `item-${String(index + 1).padStart(2, "0")}`
      },
      update: {
        title: `Emoji Item ${index + 1}`,
        prompt,
        displayOrder: index + 1
      },
      create: {
        id: `item-${String(index + 1).padStart(2, "0")}`,
        projectId: project.id,
        title: `Emoji Item ${index + 1}`,
        prompt,
        displayOrder: index + 1,
        status: ProjectStatus.pending
      }
    });
  }

  await prisma.projectLog.create({
    data: {
      projectId: project.id,
      step: reset ? "seed_reset" : "seed_verified",
      message: reset
        ? "Seed project reset and recreated for MVP demo."
        : "Seed project verified and preserved for MVP demo."
    }
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedDemoData()
    .catch(async (error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
