// MariaDB connection helper using mysql2 compatibility
// Note: In Deno, we use the mysql driver

import { Client } from "https://deno.land/x/mysql@v2.12.1/mod.ts";

let client: Client | null = null;

export async function getDBClient(): Promise<Client> {
  if (client) {
    return client;
  }

  const host = Deno.env.get("MARIADB_HOST");
  const port = Deno.env.get("MARIADB_PORT");
  const username = Deno.env.get("MARIADB_USER");
  const password = Deno.env.get("MARIADB_PASSWORD");
  const database = Deno.env.get("MARIADB_DATABASE");

  if (!host) throw new Error("MARIADB_HOST is not configured");
  if (!username) throw new Error("MARIADB_USER is not configured");
  if (!password) throw new Error("MARIADB_PASSWORD is not configured");
  if (!database) throw new Error("MARIADB_DATABASE is not configured");

  client = await new Client().connect({
    hostname: host,
    port: port ? parseInt(port) : 3306,
    username,
    password,
    db: database,
  });

  return client;
}

export async function query<T = unknown>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const db = await getDBClient();
  const result = await db.query(sql, params);
  return result as T[];
}

export async function execute(
  sql: string,
  params: unknown[] = []
): Promise<{ affectedRows: number; lastInsertId: number }> {
  const db = await getDBClient();
  const result = await db.execute(sql, params);
  return {
    affectedRows: result.affectedRows || 0,
    lastInsertId: result.lastInsertId || 0,
  };
}

export async function closeDB(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
  }
}
