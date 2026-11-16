export async function register() {
  if (
    process.env.NEXT_RUNTIME === 'nodejs' &&
    process.env.NEXT_PHASE !== 'phase-production-build' &&
    process.env.SKIP_OFFLINE_WARMUP !== 'true' &&
    !process.argv.some((arg) => arg.includes('build'))
  ) {
    const { warmAllOfflineBundles } = await import('@/lib/server/offline-bundles');
    setTimeout(() => {
      void warmAllOfflineBundles();
    }, 3000);
  }
}
