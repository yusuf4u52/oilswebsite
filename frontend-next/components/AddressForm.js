export default function AddressForm({ value, onChange, onSubmit, onCancel, submitting, testIdPrefix = "addr" }) {
  const set = (field) => (e) => onChange({ ...value, [field]: e.target.value });
  const setDigits = (field, maxLength) => (e) =>
    onChange({ ...value, [field]: e.target.value.replace(/\D/g, "").slice(0, maxLength) });

  return (
    <form
      onSubmit={onSubmit}
      className="border rounded-2xl p-6 mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4"
      style={{ borderColor: "var(--line)" }}
    >
      <input
        data-testid={`${testIdPrefix}-name`}
        required
        autoComplete="name"
        className="input sm:col-span-2"
        placeholder="Full name"
        value={value.name}
        onChange={set("name")}
      />
      <input
        data-testid={`${testIdPrefix}-mobile`}
        required
        inputMode="numeric"
        autoComplete="tel"
        className="input sm:col-span-2"
        placeholder="10-digit mobile"
        value={value.mobile}
        onChange={setDigits("mobile", 10)}
        maxLength={10}
      />
      <input
        data-testid={`${testIdPrefix}-line1`}
        required
        autoComplete="address-line1"
        className="input sm:col-span-2"
        placeholder="House / Flat / Building, Street"
        value={value.line1}
        onChange={set("line1")}
      />
      <input
        data-testid={`${testIdPrefix}-line2`}
        autoComplete="address-line2"
        className="input sm:col-span-2"
        placeholder="Area / Locality (optional)"
        value={value.line2}
        onChange={set("line2")}
      />
      <input
        data-testid={`${testIdPrefix}-city`}
        required
        autoComplete="address-level2"
        className="input"
        placeholder="City"
        value={value.city}
        onChange={set("city")}
      />
      <input
        data-testid={`${testIdPrefix}-state`}
        required
        autoComplete="address-level1"
        className="input"
        placeholder="State"
        value={value.state}
        onChange={set("state")}
      />
      <input
        data-testid={`${testIdPrefix}-pincode`}
        required
        inputMode="numeric"
        autoComplete="postal-code"
        className="input"
        placeholder="Pincode"
        maxLength={6}
        value={value.pincode}
        onChange={setDigits("pincode", 6)}
      />
      <input
        data-testid={`${testIdPrefix}-landmark`}
        className="input"
        placeholder="Landmark (optional)"
        value={value.landmark}
        onChange={set("landmark")}
      />
      <div className="sm:col-span-2 flex gap-3 justify-end">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        )}
        <button data-testid={`${testIdPrefix}-save`} type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "Saving…" : "Save Address"}
        </button>
      </div>
    </form>
  );
}
