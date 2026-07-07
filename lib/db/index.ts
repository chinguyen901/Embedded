import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export const dbEnabled = Boolean(process.env.DATABASE_URL);

export const db = dbEnabled
  ? drizzle(neon(process.env.DATABASE_URL as string), { schema })
  : null;
