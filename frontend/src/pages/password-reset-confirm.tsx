import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePasswordResetConfirm } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { BrainCircuit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const resetConfirmSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

export default function PasswordResetConfirm() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get("token") || "";
  const resetConfirm = usePasswordResetConfirm();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof resetConfirmSchema>>({
    resolver: zodResolver(resetConfirmSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = (data: z.infer<typeof resetConfirmSchema>) => {
    if (!token) {
      toast({ title: "Invalid token", description: "Password reset token is missing.", variant: "destructive" });
      return;
    }

    resetConfirm.mutate({ token, new_password: data.password }, {
      onSuccess: () => {
        toast({ title: "Password updated", description: "You can now login with your new password." });
        setLocation("/login");
      },
      onError: () => {
        toast({ title: "Reset failed", description: "The link may be expired or invalid.", variant: "destructive" });
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Create New Password</h1>
          <p className="text-muted-foreground">Please enter your new password below.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} data-testid="input-new-password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} data-testid="input-confirm-password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full" 
              disabled={resetConfirm.isPending || !token}
              data-testid="button-submit-new-password"
            >
              {resetConfirm.isPending ? "Updating..." : "Reset Password"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
