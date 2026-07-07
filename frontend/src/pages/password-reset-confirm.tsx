import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePasswordResetConfirm } from "@/hooks/use-auth";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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
    <AuthLayout
      title="Create new password"
      description="Please enter your new password below."
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
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
    </AuthLayout>
  );
}
