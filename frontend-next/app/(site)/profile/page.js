import { Suspense } from "react";
import ProfileView from "@/components/views/ProfileView";

export const metadata = {
  title: "Your Account",
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfileView />
    </Suspense>
  );
}
