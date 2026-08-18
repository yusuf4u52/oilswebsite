import LoginView from "@/components/views/LoginView";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({ title: "Login", path: "/login" });

export default async function LoginPage({ searchParams }) {
  const { next } = await searchParams;
  return <LoginView next={next || "/"} />;
}
