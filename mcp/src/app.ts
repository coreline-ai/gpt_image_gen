import express from "express";
import cors from "cors";
import path from "node:path";
import { env } from "./config/env.js";
import { createRouter } from "./api/routes.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use("/openapi", express.static(path.join(process.cwd(), "openapi")));
  app.use(createRouter());

  return app;
}
