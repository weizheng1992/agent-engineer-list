import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

const connectionString = process.env.POSTGRES_URL || 'postgres://postgres:postgres@localhost:5432/postgres';

export const client = postgres(connectionString, { max: 1 });
export const db = drizzle(client, { schema });
