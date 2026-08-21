"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { inr } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useLoadOnReady } from "@/hooks/useLoadOnReady";
import { loadRazorpayScript } from "@/lib/integrations/razorpayClient";
import InlineLogin from "@/components/checkout/InlineLogin";
import StepIndicator from "@/components/checkout/StepIndicator";
import OrderConfirmation from "@/components/checkout/OrderConfirmation";
import AddressStep from "@/components/checkout/AddressStep";
import PaymentStep from "@/components/checkout/PaymentStep";
import MobileOrderSummary from "@/components/checkout/MobileOrderSummary";
import CheckoutSummaryPanel from "@/components/checkout/CheckoutSummaryPanel";
import MobileActionBar from "@/components/checkout/MobileActionBar";
import { toast } from "sonner";

const emptyAddressForm = {
  name: "", mobile: "", line1: "", line2: "", city: "", state: "", pincode: "", landmark: "",
};

export default function CheckoutView() {
  const { items, subtotal, delivery, total, clear, updateQty, removeItem, hydrated } = useCart();
  const { user, ready } = useAuth();
  const isCustomer = !!user && user.role !== "admin" && !!user.mobile;
  const [addresses, setAddresses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addrSaving, setAddrSaving] = useState(false);
  const [step, setStep] = useState("address"); // "address" | "payment"
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [method, setMethod] = useState("razorpay");
  const [placing, setPlacing] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const router = useRouter();

  const [form, setForm] = useState(emptyAddressForm);

  const loadAddresses = async () => {
    const r = await api.get("/addresses");
    const addrs = r.data.addresses ?? [];
    setAddresses(addrs);
    const def = addrs.find((a) => a.is_default) || addrs[0];
    if (def) setSelectedId(def.id);
    if (addrs.length === 0) setShowAdd(true);
  };

  useEffect(() => {
    // Wait for the cart to finish hydrating from localStorage — otherwise
    // this fires with the initial empty items array and redirects away
    // from checkout even when the real cart is non-empty.
    if (!hydrated) return;
    if (items.length === 0 && !confirmedOrder) { router.push("/shop"); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  useLoadOnReady(isCustomer, loadAddresses, "Failed to load addresses");

  const saveAddress = async (e) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(form.mobile)) return toast.error("Enter valid mobile");
    if (!/^\d{6}$/.test(form.pincode)) return toast.error("Enter valid 6-digit pincode");
    setAddrSaving(true);
    try {
      const r = await api.post("/addresses", { ...form, is_default: addresses.length === 0 });
      toast.success("Address saved");
      setShowAdd(false);
      setForm(emptyAddressForm);
      await loadAddresses();
      if (r?.data?.id) setSelectedId(r.data.id);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to save address");
    } finally { setAddrSaving(false); }
  };

  const confirmAddress = () => {
    if (!selectedId) return toast.error("Select an address");
    setStep("payment");
  };

  const placeOrder = async () => {
    if (!selectedId) return toast.error("Select an address");
    setPlacing(true);
    try {
      const payload = {
        items: items.map((i) => ({
          product_id: i.product_id, variant_id: i.variant_id,
          name: i.name, size: i.size, price: i.price, qty: i.qty, image_url: i.image_url,
        })),
        address_id: selectedId,
        payment_method: method,
      };
      const r = await api.post("/orders", payload);
      const order = r.data.order;
      const finishOrder = (successMsg) => {
        clear();
        toast.success(successMsg);
        setConfirmedOrder({ ...order, _items: items, _total: total });
      };
      if (method === "cod") {
        await api.post(`/orders/${order.id}/cod-confirm`);
        finishOrder("Order placed! You'll pay on delivery.");
        return;
      }
      // Razorpay flow
      if (r.data.razorpay_mode === "mock") {
        // simulate a successful payment
        await api.post("/orders/verify", {
          order_id: order.id,
          razorpay_order_id: order.razorpay_order_id,
          razorpay_payment_id: `pay_mock_${Math.random().toString(36).slice(2, 10)}`,
          razorpay_signature: "mock_signature",
        });
        finishOrder("Payment successful (demo)");
        return;
      }
      try {
        await loadRazorpayScript();
      } catch {
        toast.error("Failed to load payment gateway. Please try again.");
        return;
      }
      const options = {
        key: r.data.razorpay_key_id,
        name: "Premium Oils",
        description: "Order Payment",
        order_id: order.razorpay_order_id,
        prefill: {
          name: order.address.name,
          contact: order.address.mobile,
        },
        theme: { color: "#1B4332" },
        modal: {
          ondismiss: () => {
            toast.error("Payment cancelled");
          },
        },
        handler: async (resp) => {
          try {
            await api.post("/orders/verify", {
              order_id: order.id,
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            });
            finishOrder("Payment successful");
          } catch (e) {
            toast.error("Payment verification failed");
          }
        },
      };
      const rz = new window.Razorpay(options);
      rz.on("payment.failed", (resp) => {
        toast.error(resp?.error?.description || "Payment failed. Please try again.");
      });
      rz.open();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to place order");
    } finally { setPlacing(false); }
  };

  if (confirmedOrder) {
    return (
      <OrderConfirmation
        order={confirmedOrder}
        onViewOrders={() => router.push("/orders")}
        onContinueShopping={() => router.push("/shop")}
      />
    );
  }

  if (!ready) {
    return <div className="max-w-6xl mx-auto px-6 md:px-10 py-24 text-center text-sm" style={{ color: "var(--ink-2)" }}>Loading…</div>;
  }

  if (!isCustomer) {
    return (
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-14">
        <InlineLogin />
      </div>
    );
  }

  const ctaLabel = step === "address"
    ? "Continue to Payment"
    : placing ? "Processing…" : method === "razorpay" ? `Pay ${inr(total)}` : `Place Order · ${inr(total)}`;
  const ctaDisabled = step === "address" ? !selectedId : (placing || items.length === 0);
  const ctaAction = step === "address" ? confirmAddress : placeOrder;

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-10 py-14">
      <div className="label">Checkout</div>
      <h1 className="serif text-5xl mt-2">Almost there.</h1>

      <StepIndicator step={step} />

      <MobileOrderSummary
        items={items}
        subtotal={subtotal}
        delivery={delivery}
        total={total}
        updateQty={updateQty}
        removeItem={removeItem}
        open={summaryOpen}
        onToggle={() => setSummaryOpen((o) => !o)}
      />

      <div className="grid md:grid-cols-12 gap-10 mt-8">
        <div className="md:col-span-7 space-y-6">
          <AddressStep
            step={step}
            addresses={addresses}
            selectedId={selectedId}
            onSelect={setSelectedId}
            showAdd={showAdd}
            onShowAdd={() => setShowAdd(true)}
            onHideAdd={() => setShowAdd(false)}
            form={form}
            onFormChange={setForm}
            onSaveAddress={saveAddress}
            addrSaving={addrSaving}
            onConfirmAddress={confirmAddress}
            onChangeAddress={() => setStep("address")}
          />

          {step === "payment" && <PaymentStep method={method} onSelect={setMethod} />}
        </div>

        <CheckoutSummaryPanel
          items={items}
          subtotal={subtotal}
          delivery={delivery}
          total={total}
          updateQty={updateQty}
          removeItem={removeItem}
          ctaLabel={ctaLabel}
          ctaDisabled={ctaDisabled}
          onCta={ctaAction}
        />
      </div>

      <MobileActionBar total={total} ctaLabel={ctaLabel} ctaDisabled={ctaDisabled} onCta={ctaAction} />
    </div>
  );
}
