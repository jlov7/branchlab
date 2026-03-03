const lockQueues = new Map<string, Promise<void>>();

export async function withLock<T>(key: string, work: () => Promise<T> | T): Promise<T> {
  const current = lockQueues.get(key) ?? Promise.resolve();
  let release!: () => void;
  const next = new Promise<void>((resolve) => {
    release = resolve;
  });

  lockQueues.set(key, current.then(() => next));
  await current;

  try {
    return await work();
  } finally {
    release();
    if (lockQueues.get(key) === next) {
      lockQueues.delete(key);
    }
  }
}
