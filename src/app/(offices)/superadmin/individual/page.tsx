import { Metadata } from "next";
import IndividualTemplates from "../_components/individualTemplates";

export const metadata: Metadata = {
  title: "Individual Templates"
};

export default function Page() {
  return <IndividualTemplates />
}