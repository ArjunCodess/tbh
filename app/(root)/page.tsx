import { Metadata } from "next";
import DashboardClient from "./client";

export const metadata: Metadata = {
  title: "Home",
};

export default function Hero() {
  return <DashboardClient />;
}