import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LandingPage } from "@/components/landing/landing-page";

export default async function Home() {
  const session = await auth();
  // Giriş yapmış kullanıcı doğrudan panele; ziyaretçi landing sayfasını görür.
  if (session?.user) redirect("/dashboard");
  return <LandingPage />;
}
