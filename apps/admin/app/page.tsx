import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <main className="flex flex-col items-center gap-8 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            VCEcom Admin Dashboard
          </h1>
          <p className="text-lg text-muted-foreground">
            Welcome to the admin dashboard
          </p>
        </div>
        <Link
          href="/dashboard"
          className="flex h-12 items-center justify-center rounded-md bg-primary px-6 text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Go to Dashboard
        </Link>
      </main>
    </div>
  );
}
