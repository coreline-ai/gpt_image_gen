import React from "react";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "../components/status-badge";
import { calculateProgress, resolveAssetUrl } from "../lib/api";

describe("StatusBadge", () => {
  it("renders the correct label", () => {
    render(<StatusBadge status="completed" />);
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });
});

describe("calculateProgress", () => {
  it("calculates rounded progress", () => {
    expect(calculateProgress(24, 6)).toBe(25);
    expect(calculateProgress(0, 0)).toBe(0);
  });
});

describe("resolveAssetUrl", () => {
  it("prefers assetPath and prefixes the current API base", () => {
    expect(resolveAssetUrl({ assetPath: "/storage/items/p1/test.png", imageUrl: "http://old-host/test.png" })).toBe(
      "http://localhost:3000/storage/items/p1/test.png"
    );
  });
});
