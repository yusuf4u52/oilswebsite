"use client";

import Image from "next/image";
import { inr } from "@/lib/utils";
import { Plus, Trash2, Pencil } from "lucide-react";

export default function ProductsTab({ products, onNew, onEdit, onDelete }) {
  return (
    <div className="mt-6">
      <div className="flex justify-end mb-4">
        <button data-testid="admin-new-product" onClick={onNew} className="btn-primary !rounded-md text-sm"><Plus size={14}/> New Product</button>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {products.map((p) => (
          <div key={p.id} data-testid={`admin-product-${p.slug}`} className="border rounded-md p-5 flex gap-4" style={{ borderColor: "var(--line)" }}>
            {p.image_url ? (
              <Image src={p.image_url} alt={p.name} width={96} height={112} className="w-24 h-28 object-cover rounded-md"/>
            ) : (
              <div className="w-24 h-28 rounded-md flex-shrink-0" style={{ background: "var(--bg-2)" }}/>
            )}
            <div className="flex-1">
              <div className="label" style={{ color: "var(--amber)" }}>{p.category}</div>
              <div className="serif text-xl mt-1">{p.name}</div>
              <div className="text-xs mt-1" style={{ color: "var(--ink-2)" }}>{p.variants.length} sizes · from {inr(Math.min(...p.variants.map(v => v.price)))}</div>
              <div className="mt-3 flex gap-2">
                <button data-testid={`admin-edit-${p.slug}`} onClick={() => onEdit(p)} className="btn-ghost !py-1.5 !px-3 !rounded-md text-xs"><Pencil size={12}/> Edit</button>
                <button data-testid={`admin-delete-${p.slug}`} onClick={() => onDelete(p.id)} className="btn-ghost !py-1.5 !px-3 !rounded-md text-xs"><Trash2 size={12}/> Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
