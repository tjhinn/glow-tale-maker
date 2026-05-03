export type ErrorCategory =
  | "network"
  | "auth"
  | "payment"
  | "storage"
  | "generation_timeout"
  | "validation"
  | "unknown";

export interface FriendlyError {
  category: ErrorCategory;
  title: string;
  description: string;
  actionLabel?: string;
}

export function categorizeError(error: unknown, context?: string): FriendlyError {
  const raw = error as any;
  const msg = (raw?.message || String(raw || "")).toLowerCase();
  const name = (raw?.name || "").toLowerCase();

  // Timeout / generation
  if (
    context === "cover_generation" ||
    msg.includes("timeout") ||
    msg.includes("timed out") ||
    name.includes("aborterror")
  ) {
    if (msg.includes("cover") || context === "cover_generation") {
      return {
        category: "generation_timeout",
        title: "Magic is taking longer than expected",
        description:
          "The illustration didn't finish in time. This sometimes happens when our artists are busy. Please try again in a moment.",
        actionLabel: "Try again",
      };
    }
    return {
      category: "generation_timeout",
      title: "Request timed out",
      description: "That took longer than expected. Please try again.",
      actionLabel: "Try again",
    };
  }

  // Network
  if (
    name.includes("functionsfetcherror") ||
    name.includes("functionsrelayerror") ||
    msg.includes("failed to fetch") ||
    msg.includes("network") ||
    msg.includes("offline")
  ) {
    return {
      category: "network",
      title: "Connection problem",
      description:
        "We couldn't reach our servers. Please check your internet connection and try again.",
      actionLabel: "Retry",
    };
  }

  // Auth
  if (
    msg.includes("invalid login") ||
    msg.includes("invalid credentials") ||
    msg.includes("jwt") ||
    msg.includes("unauthorized") ||
    raw?.status === 401
  ) {
    return {
      category: "auth",
      title: "Sign-in needed",
      description: "Your session expired or your credentials are incorrect. Please sign in again.",
    };
  }

  // Payment
  if (context === "payment" || msg.includes("payment") || msg.includes("lemonsqueezy") || msg.includes("stripe")) {
    return {
      category: "payment",
      title: "Payment couldn't be completed",
      description:
        "We couldn't open the secure checkout. Please try again — if it keeps happening, refresh the page or try a different card.",
      actionLabel: "Try again",
    };
  }

  // Storage
  if (context === "upload" || msg.includes("storage") || msg.includes("upload") || msg.includes("file too large")) {
    if (msg.includes("size") || msg.includes("too large")) {
      return {
        category: "storage",
        title: "Photo is too large",
        description: "Please choose a photo under 10MB.",
      };
    }
    if (msg.includes("type") || msg.includes("format")) {
      return {
        category: "storage",
        title: "Unsupported photo format",
        description: "Please use a JPG, PNG, or HEIC photo.",
      };
    }
    return {
      category: "storage",
      title: "Photo upload failed",
      description: "We couldn't save your photo. Please try uploading it again.",
      actionLabel: "Try again",
    };
  }

  // Validation
  if (context === "validation" || msg.includes("required") || msg.includes("missing")) {
    return {
      category: "validation",
      title: "Missing information",
      description: raw?.message || "Please fill in all required fields and try again.",
    };
  }

  return {
    category: "unknown",
    title: "Something went wrong",
    description:
      raw?.message && typeof raw.message === "string" && raw.message.length < 200
        ? raw.message
        : "An unexpected error occurred. Please try again.",
    actionLabel: "Try again",
  };
}