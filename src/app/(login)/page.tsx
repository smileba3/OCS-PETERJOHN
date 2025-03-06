import { type Metadata } from "next";
import MainComponent from "./_components/main";

export const metadata: Metadata = {
  title: "SMCC",
}

export default function MainPage() {
  return <MainComponent />
}