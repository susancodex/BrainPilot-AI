import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useVerifyEmail } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BrainCircuit, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get("token");
  
  const verifyEmail = useVerifyEmail();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    verifyEmail.mutate({ token }, {
      onSuccess: () => setStatus("success"),
      onError: () => setStatus("error")
    });
  }, [token]); // Run once

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="max-w-md w-full border-border shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 text-primary flex items-center justify-center rounded-full mb-4">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl">Email Verification</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-muted-foreground">Verifying your email address...</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="w-16 h-16 text-green-500" />
              <div className="space-y-2">
                <p className="text-foreground font-medium text-lg">Email verified successfully!</p>
                <p className="text-muted-foreground text-sm">Your account is now fully active.</p>
              </div>
              <Button onClick={() => setLocation("/login")} className="w-full mt-4" data-testid="button-go-login">
                Continue to Login
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="w-16 h-16 text-destructive" />
              <div className="space-y-2">
                <p className="text-foreground font-medium text-lg">Verification failed</p>
                <p className="text-muted-foreground text-sm">The link may have expired or is invalid.</p>
              </div>
              <Button onClick={() => setLocation("/login")} variant="outline" className="w-full mt-4" data-testid="button-go-login">
                Return to Login
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
