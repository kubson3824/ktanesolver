import { Alert } from "../ui/alert";

interface ErrorAlertProps {
  error?: string;
  message?: string;
  className?: string;
  onDismiss?: () => void;
}

export default function ErrorAlert({ error, message, className = "" }: ErrorAlertProps) {
  const resolvedError = error ?? message ?? "";
  if (!resolvedError) return null;

  return (
    <Alert variant="destructive" className={className}>
      {resolvedError}
    </Alert>
  );
}
