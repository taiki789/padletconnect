import { notFound } from "next/navigation";
import type { Metadata } from "next";
import StaffDashboard from "@/components/StaffDashboard";

export const metadata: Metadata = {
  title: "スタッフ管理",
  robots: { index: false, follow: false, nocache: true },
};

export const instant = false;

export default async function StaffPage({ params }: { params: Promise<{ secret: string }> }) {
  const { secret } = await params;
  if (!process.env.ADMIN_SECRET_PATH || secret !== process.env.ADMIN_SECRET_PATH) notFound();
  return <StaffDashboard />;
}
