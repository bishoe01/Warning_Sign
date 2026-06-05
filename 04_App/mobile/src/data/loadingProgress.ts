export const LOADING_STEP_MS = 1400;
export const COMPLETION_HOLD_MS = 500;

export function completedStepIndex(stepCount: number): number {
  return Math.max(0, stepCount - 1);
}

export function preCompleteMaxStepIndex(stepCount: number): number {
  return Math.max(0, stepCount - 2);
}

export function timedStepIndex(elapsedMs: number, stepCount: number): number {
  const next = Math.floor(elapsedMs / LOADING_STEP_MS);
  return Math.min(next, preCompleteMaxStepIndex(stepCount));
}

export function activeSegmentCount(stepIndex: number, stepCount: number, complete: boolean): number {
  if (complete) return stepCount;
  return Math.min(stepIndex + 1, Math.max(1, stepCount - 1));
}

export function preCompleteMinDisplayMs(stepCount: number): number {
  return preCompleteMaxStepIndex(stepCount) * LOADING_STEP_MS;
}
