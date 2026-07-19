# Vatrio Tool — Database Connection Pooling Guide

This guide details connection pooling configuration for concurrent Node/Playwright crawler runs and the Tauri React desktop application interacting with Supabase PostgreSQL.

---

## 1. Overview
High-concurrency scraping creates multiple concurrent database connection requests. To prevent connection exhaustion (`FATAL: sorry, too many clients already`):
1. **Supabase Direct Connection (Port 5432)**: Reserved for migrations and DDL scripts (`max_connections = 60`).
2. **pgBouncer Pooler (Port 6543)**: Transaction pooling mode for application queries and crawler upserts.

---

## 2. Configuration Parameters

| Environment | Host Port | Mode | Connection Limit | Max Client Connections |
|---|---|---|---|---|
| Desktop App | 6543 | Transaction | 15 | 200 |
| Crawler | 6543 | Transaction | 25 | 200 |
| Migrations | 5432 | Session | 5 | 10 |

---

## 3. Recommended Client Setup
- Use `pool_mode=transaction` in connection string query parameters.
- Limit crawler batch DB connection pools to 10 max concurrent client instances.
