import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePasswordResetRequest } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { BrainCircuit, MailCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const requestSchema = z.object({
  email: z.string().email(),
});

export default function PasswordReset() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const resetRequest = usePasswordResetRequest();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof requestSchema>>({
    resolver: zodResolver(requestSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = (data: z.infer<typeof requestSchema>) => {
    resetRequest.mutate(data, {
      onSuccess: () => {
        setIsSubmitted(true);
      },
      onError: () => {
        toast({
          title: "Request failed",
          description: "Could not process your request. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="max-w-md w-full space-y-8 bg-card p-8 rounded-xl shadow-lg border border-border">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 text-primary mb-4">
            <BrainCircuit className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Reset Password</h1>
          <p className="text-muted-foreground">
            {isSubmitted ? "Check your inbox" : "Enter your email to receive a reset link."}
          </p>
        </div>

        {isSubmitted ? (
          <div className="flex flex-col items-center space-y-6 text-center py-4">
            <MailCheck className="w-16 h-16 text-primary" />
            <div className="space-y-2">
              <p className="text-foreground">We've sent a password reset link to your email.</p>
              <p className="text-sm text-muted-foreground">It might take a few minutes to arrive. Don't forget to check your spam folder.</p>
            </div>
            <Link href="/login" className="w-full">
              <Button className="w-full" variant="outline" data-testid="button-back-to-login">
                Return to Login
              </Button>
            </Link>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} data-testid="input-reset-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full" 
                disabled={resetRequest.isPending}
                data-testid="button-submit-reset"
              >
                {resetRequest.isPending ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          </Form>
        )}

        {!isSubmitted && (
          <div className="text-center text-sm">
            <span className="text-muted-foreground">Remember your password? </span>
            <Link href="/login" className="text-primary hover:underline font-medium data-testid='link-login'">
              Sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
