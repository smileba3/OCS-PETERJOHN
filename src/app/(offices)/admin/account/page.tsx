import MyAccountSettings from "@/app/(offices)/_components/myAccount";
import { Roles } from "@/lib/modelInterfaces";

export default function Page() {
  return <MyAccountSettings role={Roles.Admin} />
}