import { redirect } from "next/navigation";

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  await params;
  redirect("/sessions");
}
