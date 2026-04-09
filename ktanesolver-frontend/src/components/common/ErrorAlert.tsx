import { Alert } from "../ui/alert";

interface ErrorAlertProps {
  error: string;
  className?: string;
}

export default function ErrorAlert({ error, className = "" }: ErrorAlertProps) {
  if (!error) return null;

  return (
    <Alert variant="error" className={className}>
      {error}
    </Alert>
  );
}
