import { Roles } from "@/lib/modelInterfaces";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function Layout({
  children
}: Readonly<{ children: React.ReactNode; }>) {
  const session = await getSession(Roles.Admin)
  if (!session) {
    return redirect("/" + Roles.Admin + "/login");
  }
  return children
}