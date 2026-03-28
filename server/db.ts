import pg from "pg";
const { Pool } = pg;
import "dotenv/config";

let pool: any = null;
let useMemoryCache = false;
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const memoryCache: Record<string, { results: any, timestamp: number }> = {};

export const initDatabase = async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn("DATABASE_URL not found, falling back to memory cache.");
    useMemoryCache = true;
    return;
  }

  try {
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });

    // Create tables if they don't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS search_cache (
        query TEXT PRIMARY KEY,
        results TEXT,
        timestamp BIGINT
      );
      CREATE TABLE IF NOT EXISTS gemini_cache (
        query TEXT PRIMARY KEY,
        results TEXT,
        timestamp BIGINT
      );
    `);
    console.log("PostgreSQL database initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize PostgreSQL database, falling back to memory cache:", error);
    useMemoryCache = true;
  }
};

export const getCachedSearch = async (query: string, table: string) => {
  const cacheKey = `${table}:${query}`;
  if (useMemoryCache || !pool) {
    const entry = memoryCache[cacheKey];
    if (entry && (Date.now() - entry.timestamp < CACHE_EXPIRY)) {
      return entry.results;
    }
    return null;
  }

  try {
    const res = await pool.query(`SELECT * FROM ${table} WHERE query = $1`, [query]);
    const row = res.rows[0];
    if (row) {
      if (Date.now() - Number(row.timestamp) < CACHE_EXPIRY) {
        return JSON.parse(row.results);
      } else {
        await pool.query(`DELETE FROM ${table} WHERE query = $1`, [query]);
      }
    }
  } catch (err) {
    console.error("Cache read error:", err);
  }
  return null;
};

export const setCachedSearch = async (query: string, results: any, table: string) => {
  const cacheKey = `${table}:${query}`;
  if (useMemoryCache || !pool) {
    memoryCache[cacheKey] = { results, timestamp: Date.now() };
    return;
  }

  try {
    await pool.query(`
      INSERT INTO ${table} (query, results, timestamp)
      VALUES ($1, $2, $3)
      ON CONFLICT (query) DO UPDATE SET
        results = EXCLUDED.results,
        timestamp = EXCLUDED.timestamp
    `, [query, JSON.stringify(results), Date.now()]);
  } catch (err) {
    console.error("Cache write error:", err);
  }
};

export const isUsingMemoryCache = () => useMemoryCache;
export const isDatabaseReady = () => !!pool;
