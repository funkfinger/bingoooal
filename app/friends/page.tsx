import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import FriendsClient from "./FriendsClient";

export default async function FriendsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <FriendsClient user={session.user} />;
}

