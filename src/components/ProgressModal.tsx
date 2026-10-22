import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export function ProgressModal({
  title,
  description,
  size = "medium",
  onClose,
  children,
  footer,
  nested = false,
  disableEscape = false
}: {
  title: string;
  description?: string;
  size?: "small" | "medium" | "wide";
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  nested?: boolean;
  disableEscape?: boolean;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (disableEscape) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [disableEscape, onClose]);
  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  return <div className={`progress-modal-backdrop${nested ? " nested" : ""}`} onMouseDown={onClose}>
    <section className={`progress-modal progress-modal--${size}`} aria-modal="true" aria-labelledby={titleId} onMouseDown={(event) => event.stopPropagation()} ref={dialogRef} role="dialog" tabIndex={-1}>
      <header className="progress-modal-header">
        <div><h2 id={titleId}>{title}</h2>{description && <p>{description}</p>}</div>
        <button aria-label={`${title}を閉じる`} className="icon-button" onClick={onClose} title="閉じる" type="button"><X size={18} /></button>
      </header>
      <div className="progress-modal-body">{children}</div>
      {footer && <footer className="progress-modal-footer">{footer}</footer>}
    </section>
  </div>;
}

