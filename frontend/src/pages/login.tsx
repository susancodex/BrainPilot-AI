import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api-error";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    console.log('Login form submitted');
    login.mutate(data, {
      onSuccess: () => {
        console.log('Login onSuccess callback triggered, navigating to /dashboard');
        setLocation("/dashboard");
        // Fallback: force navigation after a short delay
        setTimeout(() => {
          console.log('Fallback navigation to /dashboard');
          window.location.href = '/dashboard';
        }, 100);
      },
      onError: (error) => {
        console.error('Login failed:', error);
        toast({
          title: "Sign in failed",
          description: getApiErrorMessage(error, "Check your email and password."),
          variant: "destructive",
        });
      },
    });
  };

  return (
    <AuthLayout
      title="Sign in"
      description="Continue to your dashboard, sessions, and revision plan."
      footer={
        <>
          <span className="text-muted-foreground">No account? </span>
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="you@school.edu" autoComplete="email" {...field} data-testid="input-email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Your password"
                    autoComplete="current-password"
                    {...field}
                    data-testid="input-password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={login.isPending} data-testid="button-submit-login">
            {login.isPending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
}
