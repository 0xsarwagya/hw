import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  // Check if user is authenticated via cookie (proxy will handle redirect)
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_access_token");

  if (token) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
