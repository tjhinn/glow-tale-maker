import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PageWrapper } from "@/components/layout/PageWrapper";

type Status =
  | "validating"
  | "valid"
  | "already"
  | "invalid"
  | "confirming"
  | "success"
  | "error";

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>("validating");
  const [error, setError] = useState<string | null>(null);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: anonKey } },
        );
        const body = await res.json();
        if (res.ok && body.valid) setStatus("valid");
        else if (body.reason === "already_unsubscribed") setStatus("already");
        else setStatus("invalid");
      } catch {
        setStatus("invalid");
      }
    })();
  }, [token, supabaseUrl, anonKey]);

  const confirm = async () => {
    if (!token) return;
    setStatus("confirming");
    const { data, error } = await supabase.functions.invoke(
      "handle-email-unsubscribe",
      { body: { token } },
    );
    if (error) {
      setError(error.message);
      setStatus("error");
      return;
    }
    if (data?.success) setStatus("success");
    else if (data?.reason === "already_unsubscribed") setStatus("already");
    else setStatus("error");
  };

  return (
    <PageWrapper>
      <div className="mx-auto max-w-md py-16 px-6 text-center">
        <h1 className="font-fredoka text-3xl text-foreground mb-4">
          ✨ ArtBookMagic
        </h1>
        {status === "validating" && (
          <p className="text-muted-foreground">Checking your link…</p>
        )}
        {status === "valid" && (
          <>
            <h2 className="font-fredoka text-2xl mb-3">Unsubscribe?</h2>
            <p className="text-muted-foreground mb-6">
              You'll stop receiving emails from ArtBookMagic. You can still
              place orders — order confirmations may still be sent for
              critical transactional reasons.
            </p>
            <Button onClick={confirm} className="rounded-full px-8">
              Confirm unsubscribe
            </Button>
          </>
        )}
        {status === "confirming" && (
          <p className="text-muted-foreground">Unsubscribing…</p>
        )}
        {status === "success" && (
          <>
            <h2 className="font-fredoka text-2xl mb-3">You're unsubscribed</h2>
            <p className="text-muted-foreground">
              We've removed your email from our list. Sorry to see you go ✨
            </p>
          </>
        )}
        {status === "already" && (
          <>
            <h2 className="font-fredoka text-2xl mb-3">Already unsubscribed</h2>
            <p className="text-muted-foreground">
              This email is already off our list. No further action needed.
            </p>
          </>
        )}
        {status === "invalid" && (
          <>
            <h2 className="font-fredoka text-2xl mb-3">Link not valid</h2>
            <p className="text-muted-foreground">
              This unsubscribe link is invalid or expired.
            </p>
          </>
        )}
        {status === "error" && (
          <>
            <h2 className="font-fredoka text-2xl mb-3">Something went wrong</h2>
            <p className="text-muted-foreground">
              {error ?? "Please try again later."}
            </p>
          </>
        )}
      </div>
    </PageWrapper>
  );
};

export default Unsubscribe;