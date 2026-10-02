# NexeraQuest Production Deployment Guide

## 1. Production Topology
NexeraQuest is engineered as a cloud-native, containerized architecture:

```text
                          +------------------------+
                          | Cloudflare / ALB Proxy |
                          +-----------+------------+
                                      |
                     +----------------+----------------+
                     |                                 |
           +---------v---------+             +---------v---------+
           |   Next.js Apps    |             |  Background Jobs  |
           | Contributor / Proj|             | Reconciliation /  |
           | / Admin Portals   |             | Fraud / Settlement|
           +---------+---------+             +---------+---------+
                     |                                 |
                     +----------------+----------------+
                                      |
                     +----------------v----------------+
                     |   PostgreSQL 16 & Redis Cluster |
                     +---------------------------------+
```

## 2. Docker Compose Setup
Create `docker-compose.yml` for production infrastructure:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_DB: nexeraquest
      POSTGRES_USER: nexera_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    restart: always
    ports:
      - "6379:6379"

  web:
    build:
      context: .
      dockerfile: Dockerfile
    restart: always
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://nexera_user:${DB_PASSWORD}@postgres:5432/nexeraquest
      - NODE_ENV=production
    depends_on:
      - postgres
      - redis

volumes:
  pgdata:
```

## 3. Database Migration & Deployment Sequence
1. Set production environment variables (`.env`).
2. Run Prisma migrations: `npx prisma migrate deploy`.
3. Seed baseline system settings and pricing rules: `npm run db:seed`.
4. Build Next.js application: `npm run build`.
5. Launch background workers via process manager (e.g. PM2 or Kubernetes cron jobs).
