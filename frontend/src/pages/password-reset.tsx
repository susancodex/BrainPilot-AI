import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePasswordResetRequest } from "@/hooks/use-auth";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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
    <AuthLayout
      title={isSubmitted ? "Check your inbox" : "Reset password"}
      description={isSubmitted ? "We've sent a password reset link to your email." : "Enter your email to receive a reset link."}
      footer={
        <>
          <span className="text-muted-foreground">Remember your password? </span>
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      {isSubmitted ? (
        <div className="space-y-4 text-center py-4">
          <p className="text-foreground">It might take a few minutes to arrive. Don't forget to check your spam folder.</p>
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
                  <FormLabel>Email</FormLabel>
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
    </AuthLayout>
  );
}
