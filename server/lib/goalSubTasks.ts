export function effectiveSubTaskDone(
  kind: string,
  isDone: boolean,
  automaticIsDone: boolean,
  completionOverride: boolean | null
) {
  return kind === "standard" ? isDone : completionOverride ?? automaticIsDone;
}
