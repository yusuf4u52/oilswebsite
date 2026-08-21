"use client";

import { MapPin, Plus } from "lucide-react";
import AddressForm from "@/components/AddressForm";

export default function AddressStep({
  step,
  addresses,
  selectedId,
  onSelect,
  showAdd,
  onShowAdd,
  onHideAdd,
  form,
  onFormChange,
  onSaveAddress,
  addrSaving,
  onConfirmAddress,
  onChangeAddress,
}) {
  const selectedAddress = addresses.find((a) => a.id === selectedId);

  return (
    <section className="border rounded-3xl p-6" style={{ borderColor: "var(--line)" }}>
      {step === "address" ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="serif text-2xl flex items-center gap-2"><MapPin size={18}/> Delivery Address</div>
            {!showAdd && (
              <button data-testid="ck-add-addr" onClick={onShowAdd} className="btn-ghost !py-2 !px-3 text-sm"><Plus size={14}/> New</button>
            )}
          </div>

          {addresses.length === 0 && !showAdd && (
            <p className="text-sm" style={{ color: "var(--ink-2)" }}>No addresses yet. Add one.</p>
          )}

          <div className="space-y-3">
            {addresses.map((a) => (
              <label
                key={a.id}
                data-testid={`addr-option-${a.id}`}
                className={`block border rounded-2xl p-5 cursor-pointer transition-colors ${selectedId === a.id ? "border-[#1B4332] bg-[#1B4332]/5" : ""}`}
                style={{ borderColor: selectedId === a.id ? "var(--brand)" : "var(--line)" }}
              >
                <div className="flex items-start gap-3">
                  <input type="radio" name="addr" checked={selectedId === a.id} onChange={() => onSelect(a.id)} className="mt-1 w-[18px] h-[18px]"/>
                  <div>
                    <div className="font-medium">{a.name} · +91 {a.mobile}</div>
                    <div className="text-sm mt-1" style={{ color: "var(--ink-2)" }}>
                      {a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} — {a.pincode}
                      {a.landmark ? ` · Near ${a.landmark}` : ""}
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>

          {showAdd && (
            <AddressForm
              value={form}
              onChange={onFormChange}
              onSubmit={onSaveAddress}
              onCancel={addresses.length > 0 ? onHideAdd : undefined}
              submitting={addrSaving}
              testIdPrefix="addr"
            />
          )}

          {!showAdd && addresses.length > 0 && (
            <button data-testid="ck-confirm-address" onClick={onConfirmAddress} disabled={!selectedId} className="btn-primary w-full justify-center mt-5">
              Deliver to this address
            </button>
          )}
        </>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <MapPin size={18} className="mt-0.5" style={{ color: "var(--brand)" }}/>
            <div>
              <div className="font-medium">{selectedAddress?.name} · +91 {selectedAddress?.mobile}</div>
              <div className="text-sm mt-1" style={{ color: "var(--ink-2)" }}>
                {selectedAddress?.line1}{selectedAddress?.line2 ? `, ${selectedAddress.line2}` : ""}, {selectedAddress?.city}, {selectedAddress?.state} — {selectedAddress?.pincode}
                {selectedAddress?.landmark ? ` · Near ${selectedAddress.landmark}` : ""}
              </div>
            </div>
          </div>
          <button data-testid="ck-change-address" onClick={onChangeAddress} className="text-sm underline shrink-0">Change</button>
        </div>
      )}
    </section>
  );
}
