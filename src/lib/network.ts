/** True when an error looks like lost/weak signal rather than a real rejection. */
export function isNetworkError(error: unknown): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  const msg = (error instanceof Error ? `${error.name} ${error.message}` : String(error)).toLowerCase();
  return /failed to fetch|networkerror|network request failed|load failed|timeout|timed out|fetch failed|aborted|err_network|err_internet|connection/.test(
    msg,
  );
}

/** Rejects if the promise takes too long — weak signal should fall back to saving for later. */
export function withTimeout<T>(promise: Promise<T>, ms = 25000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Request timed out")), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}
