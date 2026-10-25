import type { ReactNode } from "react";
export default function LoadingState({
  label = "Loading workspace…",
  variant = "table",
}: {
  label?: ReactNode;
  variant?: "table" | "form" | "cards" | "dashboard" | "inline";
}) {
  return (
    <section
      className={`ui-loading ui-loading--${variant}`}
      aria-busy="true"
      aria-label="Loading content"
    >
      <span role="status" className="sr-only">
        {label}
      </span>
      <div aria-hidden="true">
        {variant === "inline" ? (
          <span className="ui-skeleton ui-skeleton-line" />
        ) : (
          <>
            <div className="ui-loading-toolbar">
              <span className="ui-skeleton" />
              <span className="ui-skeleton" />
            </div>
            {variant === "table" ? (
              <div className="ui-loading-rows">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i}>
                    <span className="ui-skeleton" />
                    <span className="ui-skeleton" />
                    <span className="ui-skeleton" />
                  </div>
                ))}
              </div>
            ) : variant === "form" ? (
              <div className="ui-loading-fields">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i}>
                    <span className="ui-skeleton ui-skeleton-label" />
                    <span className="ui-skeleton ui-skeleton-input" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="ui-loading-cards">
                {Array.from(
                  { length: variant === "dashboard" ? 4 : 3 },
                  (_, i) => (
                    <div key={i}>
                      <span className="ui-skeleton ui-skeleton-label" />
                      <span className="ui-skeleton ui-skeleton-value" />
                      <span className="ui-skeleton ui-skeleton-line" />
                    </div>
                  ),
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
export function ErrorState({
  message,
  onRetry,
  title = "We couldn’t load this view",
  pending = false,
}: {
  message: string;
  onRetry?: () => void;
  title?: string;
  pending?: boolean;
}) {
  return (
    <section role="alert" className="ui-error">
      <h2>{title}</h2>
      <p>{message}</p>
      {onRetry && (
        <button className="btn" disabled={pending} onClick={onRetry}>
          {pending ? "Trying again…" : "Try again"}
        </button>
      )}
    </section>
  );
}
