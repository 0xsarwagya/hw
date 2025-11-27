import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Sign in to access the admin panel
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
