import type { ProjectDetail } from "../lib/api";

export function LogPanel({ logs }: { logs: ProjectDetail["logs"] }) {
  return (
    <section className="card">
      <div style={{ display: "grid", gap: 12 }}>
        <h3>Recent Logs</h3>
        <div className="log-list">
          {logs.length === 0 ? (
            <p className="muted">No logs yet.</p>
          ) : (
            logs.map((log) => (
              <div className="log-row" key={log.id}>
                <div className="meta">
                  <strong>{log.step}</strong>
                  <span>{new Date(log.createdAt).toLocaleString()}</span>
                </div>
                <p style={{ margin: "6px 0 0" }}>{log.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
