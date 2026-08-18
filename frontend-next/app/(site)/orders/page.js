import { Suspense } from "react";
import OrdersView from "@/components/views/OrdersView";

export const metadata = {
  title: "Your Orders",
  robots: { index: false, follow: false },
};

export default function OrdersPage() {
  return (
    <Suspense fallback={null}>
      <OrdersView />
    </Suspense>
  );
}
