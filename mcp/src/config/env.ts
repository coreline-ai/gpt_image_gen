import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const withFallback = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (value === "" || value === null ? undefined : value), schema);

const EnvSchema = z.object({
  DATABASE_URL: withFallback(z.string().default("file:./dev.db")),
  PORT: withFallback(z.coerce.number().int().positive().default(3000)),
  BASE_URL: withFallback(z.string().default("http://localhost:3000")),
  STORAGE_ROOT: withFallback(z.string().default("./storage"))
});

const parsed = EnvSchema.parse(process.env);

export const env = {
  ...parsed,
  STORAGE_ROOT: path.resolve(process.cwd(), parsed.STORAGE_ROOT)
};
