import Link from "next/link";
import type { ProjectSummary } from "../lib/api";
import { calculateProgress } from "../lib/api";
import { StatusBadge } from "./status-badge";

export function ProjectCard({ project }: { project: ProjectSummary }) {
  const progress = calculateProgress(project.totalItems, project.completedItems);

  return (
    <article className="card">
      <div className="meta">
        <StatusBadge status={project.status} />
        <span>{project.completedItems}/{project.totalItems} complete</span>
      </div>
      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        <h2>{project.name}</h2>
        <p className="muted">{project.description}</p>
        <div className="progress" aria-label={`${progress}% complete`}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="meta">
          <span>Updated {new Date(project.updatedAt).toLocaleString()}</span>
          <span>{project.slug}</span>
        </div>
        <Link className="button" href={`/project/${project.projectId}`}>
          View Project
        </Link>
      </div>
    </article>
  );
}
