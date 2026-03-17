import { ProjectCard } from "../components/project-card";
import { getProjects } from "../lib/api";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const projects = await getProjects();

  return (
    <main>
      <section className="hero">
        <span className="status-badge status-completed">MVP Dashboard</span>
        <h1>Custom GPT Image Projects</h1>
        <p>
          Review MCP-backed image generation projects, track upload progress, and open completed images stored on the
          local WebApp server.
        </p>
      </section>

      <section className="grid project-grid">
        {projects.map((project) => (
          <ProjectCard key={project.projectId} project={project} />
        ))}
      </section>
    </main>
  );
}
