import LoginForm from "@/app/(login)/_components/loginForm";
import { Roles } from "@/lib/modelInterfaces";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Head Login",
}

export default function AdminLoginPage() {
  return <LoginForm role={Roles.Admin} />
}