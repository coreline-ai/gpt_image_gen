import Link from "next/link";
import { ItemList } from "../../../components/item-list";
import { LogPanel } from "../../../components/log-panel";
import { StatusBadge } from "../../../components/status-badge";
import { calculateProgress, getProject } from "../../../lib/api";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getProject(id);
  const progress = calculateProgress(detail.project.totalItems, detail.project.completedItems);

  return (
    <main>
      <Link className="button secondary" href="/">
        Back to projects
      </Link>

      <section className="hero" style={{ marginTop: 20 }}>
        <div className="meta">
          <StatusBadge status={detail.project.status} />
          <span>{detail.project.completedItems}/{detail.project.totalItems} uploaded</span>
        </div>
        <h1>{detail.project.name}</h1>
        <p>{detail.project.description}</p>
        <div className="progress" aria-label={`${progress}% complete`}>
          <span style={{ width: `${progress}%` }} />
        </div>
      </section>

      <section className="detail-layout">
        <section className="card">
          <div style={{ display: "grid", gap: 16 }}>
            <div className="meta">
              <span>Upload target: {detail.project.uploadTarget}</span>
              <span>Storage pattern: {detail.project.storagePathTemplate}</span>
            </div>
            <ItemList items={detail.items} />
          </div>
        </section>

        <LogPanel logs={detail.logs} />
      </section>
    </main>
  );
}
