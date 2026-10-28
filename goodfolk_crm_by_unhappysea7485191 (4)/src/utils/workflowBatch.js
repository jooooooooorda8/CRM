export function getNextWorkflowBatch(targetValue, savedRun) {
  const target = Math.max(10, Math.min(100, Number(targetValue) || 100));
  const savedProgress = savedRun?.target === target && savedRun.status !== 'running'
    ? Math.min(target, Math.max(0, Number(savedRun.generated) || 0))
    : 0;
  const startAt = savedProgress >= target ? 0 : savedProgress;
  const batchEnd = Math.min(target, startAt + 10);
  return {
    target,
    startAt,
    batchEnd,
    batchNumber: Math.floor(startAt / 10) + 1,
    batchSize: batchEnd - startAt,
  };
}
