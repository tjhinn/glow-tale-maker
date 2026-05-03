import { categorizeError, type FriendlyError } from "./errorMessages";

type ToastFn = (opts: {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}) => void;

interface HandleErrorOptions {
  context?: string;
  toast?: ToastFn;
  silent?: boolean;
}

/**
 * Centralized error handler. Logs the error with context, maps it to a
 * friendly message, optionally fires a toast, and returns the categorized
 * error so callers can branch on it (e.g. show a retry button).
 */
export function handleError(error: unknown, opts: HandleErrorOptions = {}): FriendlyError {
  const { context, toast, silent } = opts;
  const friendly = categorizeError(error, context);

  // Always log full detail for debugging
  // eslint-disable-next-line no-console
  console.error(`[${context || "app"}] ${friendly.category}:`, error);

  if (toast && !silent) {
    toast({
      title: friendly.title,
      description: friendly.description,
      variant: "destructive",
    });
  }

  return friendly;
}