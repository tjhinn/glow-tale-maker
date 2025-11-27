import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface OrderErrorAlertProps {
  errorLog: string;
  generationAttempts: number | null;
}

export function OrderErrorAlert({
  errorLog,
  generationAttempts,
}: OrderErrorAlertProps) {
  if (!errorLog) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>
        Generation Failed (Attempt {generationAttempts || 0}/3)
      </AlertTitle>
      <AlertDescription className="mt-2">
        <div className="text-sm whitespace-pre-wrap break-words">{errorLog}</div>
      </AlertDescription>
    </Alert>
  );
}
