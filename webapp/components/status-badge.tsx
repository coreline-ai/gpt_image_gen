import React from "react";

type Props = {
  status: "pending" | "in_progress" | "completed" | "failed";
};

const labels: Record<Props["status"], string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  failed: "Failed"
};

export function StatusBadge({ status }: Props) {
  return <span className={`status-badge status-${status}`}>{labels[status]}</span>;
}
