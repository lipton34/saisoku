import { useEffect, useState } from "react";

export function DeferredNumberInput({ value, min, max, onCommit, autoFocus = false }: { value: number; min: number; max: number; onCommit: (value: number) => void; autoFocus?: boolean }) {
  const [draftValue, setDraftValue] = useState(String(value));

  useEffect(() => { setDraftValue(String(value)); }, [value]);

  function commit() {
    const parsed = Number(draftValue);
    const normalized = draftValue === "" || !Number.isFinite(parsed) ? min : Math.min(max, Math.max(min, Math.trunc(parsed)));
    setDraftValue(String(normalized));
    onCommit(normalized);
  }

  return <input autoFocus={autoFocus} inputMode="numeric" max={max} min={min} onBlur={commit} onChange={(event) => {
    const raw = event.target.value;
    setDraftValue(raw);
    const parsed = Number(raw);
    if (raw !== "" && Number.isFinite(parsed)) onCommit(parsed);
  }} required type="number" value={draftValue} />;
}
