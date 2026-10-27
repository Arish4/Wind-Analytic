export function LoadingPanel({ label = "Loading forecasts from Elexon…" }: { label?: string }) {
  return (
    <div className="panel status-panel" role="status">
      <span className="spinner" />
      {label}
    </div>
  );
}

export function ErrorPanel({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="panel status-panel status-panel--error" role="alert">
      <strong>Something went wrong</strong>
      <span>{message}</span>
      {onRetry && (
        <button className="pill pill--dark" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
