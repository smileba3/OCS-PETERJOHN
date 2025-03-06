import { Metadata } from "next";
import DashboardPage from "./_components/dashboard";

export const metadata: Metadata = {
  title: "Admin"
};

export default function Page() {
  return (
    <div className="w-full">
      <DashboardPage />
    </div>
  )
}