import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrderErrorAlertProps {
  errorLog: string;
  generationAttempts: number | null;
  onClear?: () => void;
}

export function OrderErrorAlert({
  errorLog,
  generationAttempts,
  onClear,
}: OrderErrorAlertProps) {
  if (!errorLog) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>Generation Failed (Attempt {generationAttempts || 0}/3)</span>
        {onClear && (
          <Button variant="ghost" size="sm" onClick={onClear} className="h-6 w-6 p-0 hover:bg-destructive/20">
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </AlertTitle>
      <AlertDescription className="mt-2">
        <div className="text-sm whitespace-pre-wrap break-words">{errorLog}</div>
      </AlertDescription>
    </Alert>
  );
}
