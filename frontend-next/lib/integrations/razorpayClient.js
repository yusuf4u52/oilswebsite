const RAZORPAY_SRC = "https://checkout.razorpay.com/v1/checkout.js";

// Browser-only: loads the Razorpay checkout script once, reusing an
// in-flight/previous <script> tag if one is already on the page.
export function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve();
  const existing = document.querySelector(`script[src="${RAZORPAY_SRC}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", resolve);
      existing.addEventListener("error", reject);
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_SRC;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}
