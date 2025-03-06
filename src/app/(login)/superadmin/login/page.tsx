import LoginForm from "@/app/(login)/_components/loginForm";
import { Roles } from "@/lib/modelInterfaces";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Login",
}

export default function SuperLoginPage() {
  return <LoginForm role={Roles.SuperAdmin} />
}