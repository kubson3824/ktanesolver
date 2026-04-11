import { Alert } from "../ui/alert";

interface ErrorAlertProps {
  error?: string;
  message?: string;
  className?: string;
  onDismiss?: () => void;
}

export default function ErrorAlert({ error, message, className = "", onDismiss }: ErrorAlertProps) {
  const resolvedError = error ?? message ?? "";
  if (!resolvedError) return null;

  return (
    <Alert variant="destructive" className={`flex items-start justify-between gap-2 ${className}`}>
      <span>{resolvedError}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 opacity-70 hover:opacity-100 transition-opacity text-xs leading-none mt-0.5"
          aria-label="Dismiss error"
        >
          ✕
        </button>
      )}
    </Alert>
  );
}
