import { StatusBadge } from "./status-badge";
import { resolveAssetUrl } from "../lib/api";
import type { ProjectDetail } from "../lib/api";

export function ItemList({ items }: { items: ProjectDetail["items"] }) {
  return (
    <div className="item-list">
      {items.map((item) => {
        const assetUrl = resolveAssetUrl({
          assetPath: item.assetPath,
          imageUrl: item.imageUrl
        });

        return (
          <article className="item-row" key={item.id}>
            <div className="meta">
              <span>#{item.displayOrder}</span>
              <StatusBadge status={item.status} />
            </div>
            <div className="item-preview">
              <div className="thumbnail">
                {assetUrl ? (
                  <img alt={item.title} src={assetUrl} />
                ) : (
                  <span>No image uploaded yet</span>
                )}
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                <h3>{item.title}</h3>
                <p style={{ margin: 0 }}>{item.prompt}</p>
                <div className="meta">
                  {item.uploadedAt ? <span>Uploaded {new Date(item.uploadedAt).toLocaleString()}</span> : null}
                  {item.errorMessage ? <span style={{ color: "var(--danger)" }}>{item.errorMessage}</span> : null}
                </div>
                {assetUrl ? (
                  <a className="button secondary" href={assetUrl} rel="noreferrer" target="_blank">
                    View Uploaded Image
                  </a>
                ) : (
                  <span className="muted">Waiting for Custom GPT upload</span>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
