import { Roles } from "@/lib/modelInterfaces";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";


export default async function Template({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getSession(Roles.SuperAdmin);
  if (session) {
    return redirect("/" + session.user.role);
  }
  return <>{children}</>
}
