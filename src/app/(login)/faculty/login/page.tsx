import LoginForm from "@/app/(login)/_components/loginForm";
import { Roles } from "@/lib/modelInterfaces";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Faculty Login",
}

export default function FacultyLoginPage() {
  return <LoginForm role={Roles.Faculty} />
}