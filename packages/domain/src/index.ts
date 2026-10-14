export interface Clock {
  now(): Date;
}
export const systemClock: Clock = { now: () => new Date() };
export type WorkspaceRole = 'member' | 'admin';
export const defaultPolicy = Object.freeze({
  advanceDays: 90,
  leadMinutes: 5,
  minDurationMinutes: 15,
  maxDurationMinutes: 480,
  durationIncrementMinutes: 15,
  cancellationCutoffMinutes: 60,
  checkInOpeningMinutes: 15,
  noShowGraceMinutes: 15,
});
