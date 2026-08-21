"use client";

import { useState } from "react";
import Image from "next/image";
import api from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2, X, UploadCloud } from "lucide-react";

const emptyForm = {
  slug: "", name: "", category: "groundnut",
  short_description: "", description: "",
  image_url: "", gallery: [],
  highlights: [],
  variants: [{ size: "500ml", price: 0, mrp: 0, stock: 100 }],
  is_active: true,
};

function toFormState(p) {
  if (!p) return emptyForm;
  return {
    slug: p.slug, name: p.name, category: p.category,
    short_description: p.short_description, description: p.description,
    image_url: p.image_url, gallery: p.gallery || [],
    highlights: p.highlights || [],
    variants: p.variants.map((v) => ({ ...v })),
    is_active: p.is_active,
  };
}

// Owns the create/edit product form's own state — the parent only decides
// which product (or none) is being edited and what happens after a save.
export default function ProductFormModal({ editing, onClose, onSaved }) {
  const [form, setForm] = useState(() => toFormState(editing));
  const [uploading, setUploading] = useState(false);

  const saveProduct = async (e) => {
    e.preventDefault();
    if (!form.image_url) {
      toast.error("Please upload a product image");
      return;
    }
    try {
      if (editing) await api.put(`/admin/products/${editing.id}`, form);
      else await api.post("/admin/products", form);
      toast.success("Saved");
      onSaved();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    }
  };

  const uploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    try {
      const res = await api.post("/admin/upload", fd);
      setForm((f) => ({ ...f, image_url: res.data.url }));
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const updateVariant = (idx, patch) => {
    const v = [...form.variants]; v[idx] = { ...v[idx], ...patch }; setForm({ ...form, variants: v });
  };
  const addVariant = () => setForm({ ...form, variants: [...form.variants, { size: "", price: 0, mrp: 0, stock: 100 }] });
  const removeVariant = (idx) => setForm({ ...form, variants: form.variants.filter((_, i) => i !== idx) });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <form
        onSubmit={saveProduct}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-white rounded-2xl p-6 max-h-[90vh] overflow-y-auto space-y-4"
      >
        <div className="flex justify-between items-center">
          <div className="serif text-2xl">{editing ? "Edit Product" : "New Product"}</div>
          <button type="button" onClick={onClose}><X size={18}/></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input data-testid="pf-name" required className="input col-span-2" placeholder="Name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value, slug: form.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-")})}/>
          <input data-testid="pf-slug" required className="input" placeholder="Slug (unique)" value={form.slug} onChange={(e) => setForm({...form, slug: e.target.value})}/>
          <select data-testid="pf-category" className="input" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}>
            {["groundnut","coconut","almond","other"].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="col-span-2 flex items-center gap-3">
            <label className="btn-ghost !py-1.5 !px-3 !rounded-md text-xs cursor-pointer">
              <UploadCloud size={12}/> {uploading ? "Uploading..." : form.image_url ? "Replace image" : "Upload image"}
              <input data-testid="pf-image-file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={uploadImage} disabled={uploading}/>
            </label>
            {form.image_url && (
              <Image src={form.image_url} alt="Preview" width={48} height={48} className="h-12 w-12 object-cover rounded-md border" style={{ borderColor: "var(--line)" }}/>
            )}
          </div>
          <input data-testid="pf-short" required className="input col-span-2" placeholder="Short description" value={form.short_description} onChange={(e) => setForm({...form, short_description: e.target.value})}/>
          <textarea data-testid="pf-desc" required className="input col-span-2" rows={3} placeholder="Full description" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})}/>
          <input data-testid="pf-highlights" className="input col-span-2" placeholder="Highlights (comma-separated)" value={(form.highlights || []).join(", ")} onChange={(e) => setForm({...form, highlights: e.target.value.split(",").map((s) => s.trim()).filter(Boolean)})}/>
        </div>
        <div>
          <div className="label mb-2">Variants</div>
          <div className="grid grid-cols-12 gap-2 mb-1 text-xs" style={{ color: "var(--ink-2)" }}>
            <div className="col-span-3">Size</div>
            <div className="col-span-3">Price</div>
            <div className="col-span-3">MRP</div>
            <div className="col-span-2">Stock</div>
            <div className="col-span-1"></div>
          </div>
          {form.variants.map((v, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 mb-2 items-center">
              <input data-testid={`pf-v-size-${idx}`} className="input col-span-3" placeholder="Size" value={v.size} onChange={(e) => updateVariant(idx, { size: e.target.value })}/>
              <input data-testid={`pf-v-price-${idx}`} type="number" className="input col-span-3" placeholder="Price" value={v.price} onChange={(e) => updateVariant(idx, { price: Number(e.target.value) })}/>
              <input data-testid={`pf-v-mrp-${idx}`} type="number" className="input col-span-3" placeholder="MRP" value={v.mrp} onChange={(e) => updateVariant(idx, { mrp: Number(e.target.value) })}/>
              <input data-testid={`pf-v-stock-${idx}`} type="number" className="input col-span-2" placeholder="Stock" value={v.stock} onChange={(e) => updateVariant(idx, { stock: Number(e.target.value) })}/>
              <button type="button" onClick={() => removeVariant(idx)} className="col-span-1"><Trash2 size={14}/></button>
            </div>
          ))}
          <button type="button" onClick={addVariant} className="btn-ghost !py-1.5 !px-3 !rounded-md text-xs"><Plus size={12}/> Add variant</button>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost !rounded-md">Cancel</button>
          <button data-testid="pf-save" type="submit" className="btn-primary !rounded-md">Save</button>
        </div>
      </form>
    </div>
  );
}
