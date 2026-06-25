import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { RegisterForm } from "@/components/auth/register-form";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/findeks");

  const userCount = await db.user.count();
  return <RegisterForm isFirstUser={userCount === 0} />;
}
