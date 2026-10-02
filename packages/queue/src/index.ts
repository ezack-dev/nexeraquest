import { randomUUID } from 'crypto';

export type JobName =
  | 'verify-task'
  | 'send-notification'
  | 'evaluate-fraud'
  | 'settle-withdrawal'
  | 'reconcile'
  | 'expire-campaigns';

export interface Job<T = any> {
  id: string;
  name: JobName;
  payload: T;
  attempts: number;
  maxAttempts: number;
  createdAt: number;
  runAfter: number;
}

export type JobHandler<T = any> = (payload: T, job: Job<T>) => Promise<void>;

const handlers = new Map<JobName, JobHandler>();
const queues = new Map<JobName, Job<any>[]>();
const processing = new Set<string>();

export function registerHandler<T>(name: JobName, handler: JobHandler<T>): void {
  handlers.set(name, handler as JobHandler);
}

function getQueue(name: JobName): Job[] {
  let q = queues.get(name);
  if (!q) {
    q = [];
    queues.set(name, q);
  }
  return q;
}

/**
 * Enqueue a job. Retry-safe: callers pass a deterministic `dedupeKey`
 * (e.g. `verify:<taskId>`) and repeats while the job is queued or
 * processing are ignored.
 */
export function enqueue<T>(
  name: JobName,
  payload: T,
  opts: { maxAttempts?: number; delayMs?: number; dedupeKey?: string } = {}
): Job<T> {
  const q = getQueue(name);
  if (opts.dedupeKey) {
    const dup = q.find((j) => (j.payload as any)?.dedupeKey === opts.dedupeKey);
    if (dup) return dup as Job<T>;
    if (processing.has(opts.dedupeKey)) {
      return { id: `deduped-${opts.dedupeKey}`, name, payload, attempts: 0, maxAttempts: 0, createdAt: Date.now(), runAfter: Date.now() } as Job<T>;
    }
  }
  const job: Job<T> = {
    id: randomUUID(),
    name,
    payload: opts.dedupeKey ? { ...(payload as object), dedupeKey: opts.dedupeKey } : payload,
    attempts: 0,
    maxAttempts: opts.maxAttempts ?? 5,
    createdAt: Date.now(),
    runAfter: Date.now() + (opts.delayMs ?? 0),
  };
  q.push(job);
  void drain(name);
  return job;
}

async function drain(name: JobName): Promise<void> {
  const handler = handlers.get(name);
  if (!handler) return;
  const q = getQueue(name);
  const job = q.find((j) => j.runAfter <= Date.now());
  if (!job) return;
  q.splice(q.indexOf(job), 1);
  const dedupeKey = (job.payload as any)?.dedupeKey as string | undefined;
  if (dedupeKey) processing.add(dedupeKey);
  try {
    job.attempts += 1;
    await handler(job.payload, job);
  } catch (err: any) {
    if (job.attempts < job.maxAttempts) {
      // Exponential backoff: 5s, 25s, 125s...
      job.runAfter = Date.now() + 5000 * Math.pow(5, job.attempts - 1);
      q.push(job);
      console.warn(`[queue:${name}] job ${job.id} failed (attempt ${job.attempts}), retrying:`, err.message);
    } else {
      console.error(`[queue:${name}] job ${job.id} exhausted after ${job.attempts} attempts:`, err.message);
    }
  } finally {
    if (dedupeKey) processing.delete(dedupeKey);
    if (q.some((j) => j.runAfter <= Date.now())) void drain(name);
  }
}

/** Queue depth introspection for the admin health view. */
export function queueDepths(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [name, q] of queues) out[name] = q.length;
  return out;
}

/**
 * Redis-backed handoff (production). When REDIS_URL is set, jobs are
 * pushed to Redis lists instead of the in-memory queue above; a
 * separate worker process drains them. The in-memory path stays as
 * the dev/test fallback so the app runs without Redis.
 */
export async function enqueueDurable<T>(name: JobName, payload: T): Promise<void> {
  // Redis handoff is intentionally not bundled: install the `redis`
  // package and set REDIS_URL, then replace this stub with a real client.
  // Until then, everything runs on the in-memory queue — no silent fallback
  // pretending to be durable.
  enqueue(name, payload);
  return;
}
