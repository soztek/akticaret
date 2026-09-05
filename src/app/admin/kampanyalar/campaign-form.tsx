"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Search, Loader2, X, Link2 } from "lucide-react";
import { ImageUpload } from "@/components/admin/image-upload";
import { FormError } from "@/components/form";
import { saveCampaign, type CampaignInput } from "@/lib/actions/admin-campaigns";
import { formatTL } from "@/lib/format";

type Linked = { id: string; name: string; slug: string; imageUrl: string | null; price: number; listPrice: number };

export function CampaignForm({
  campaign,
}: {
  campaign?: {
    id: string;
    title: string;
    imageUrl: string | null;
    description: string | null;
    price: number | null;
    compareAtPrice: number | null;
    badge: string | null;
    productId: string | null;
    isPublished: boolean;
    startsAt: string | null;
    endsAt: string | null;
    linkedProduct: { name: string; slug: string } | null;
  };
}) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const [title, setTitle] = useState(campaign?.title ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(campaign?.imageUrl ?? null);
  const [description, setDescription] = useState(campaign?.description ?? "");
  const [price, setPrice] = useState(campaign?.price?.toString() ?? "");
  const [compareAt, setCompareAt] = useState(campaign?.compareAtPrice?.toString() ?? "");
  const [badge, setBadge] = useState(campaign?.badge ?? "");
  const [productId, setProductId] = useState<string | null>(campaign?.productId ?? null);
  const [linkedName, setLinkedName] = useState<string | null>(campaign?.linkedProduct?.name ?? null);
  const [isPublished, setIsPublished] = useState(campaign?.isPublished ?? false);
  const [startsAt, setStartsAt] = useState(campaign?.startsAt ?? "");
  const [endsAt, setEndsAt] = useState(campaign?.endsAt ?? "");

  // Canlı ürün arama
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Linked[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(
          (data.results ?? []).map((p: { id: string; name: string; slug: string; imageUrl: string | null; b2cPrice: number; listPrice: number }) => ({
            id: p.id, name: p.name, slug: p.slug, imageUrl: p.imageUrl, price: p.b2cPrice, listPrice: p.listPrice,
          })),
        );
        setOpen(true);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function linkProduct(p: Linked) {
    setProductId(p.id);
    setLinkedName(p.name);
    if (!title.trim()) setTitle(p.name);
    if (!imageUrl) setImageUrl(p.imageUrl);
    if (!price) setPrice(String(p.price));
    if (!compareAt && p.listPrice > p.price) setCompareAt(String(p.listPrice));
    setOpen(false);
    setQ("");
  }

  function unlink() {
    setProductId(null);
    setLinkedName(null);
  }

  function save() {
    setErr(null);
    const input: CampaignInput = {
      id: campaign?.id,
      title,
      imageUrl,
      description: description || null,
      price: price ? Number(price.replace(",", ".")) : null,
      compareAtPrice: compareAt ? Number(compareAt.replace(",", ".")) : null,
      badge: badge || null,
      productId,
      isPublished,
      startsAt: startsAt || null,
      endsAt: endsAt || null,
    };
    start(async () => {
      const r = await saveCampaign(input);
      if (r?.error) setErr(r.error);
    });
  }

  return (
    <div className="mt-5 max-w-2xl space-y-5">
      <FormError message={err ?? undefined} />

      {/* Ürün bağlama (canlı arama) */}
      <div ref={boxRef} className="relative">
        <label className="mb-1.5 block text-sm font-medium text-ink">
          Mevcut Ürün Bağla <span className="font-normal text-muted">(opsiyonel — canlı stok araması)</span>
        </label>
        {productId && linkedName ? (
          <div className="flex items-center gap-2 rounded-lg border border-orange/40 bg-orange/5 px-3 py-2.5 text-sm">
            <Link2 className="h-4 w-4 text-orange" />
            <span className="flex-1 font-medium text-ink">{linkedName}</span>
            <button type="button" onClick={unlink} className="text-muted hover:text-danger">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ürün adı veya kod ile ara…"
              className="w-full rounded-lg border border-line bg-paper py-2.5 pl-9 pr-9 text-sm outline-none focus:border-orange"
            />
            {searching && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-orange" />}
            {open && results.length > 0 && (
              <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-line bg-paper py-1 shadow-xl">
                {results.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => linkProduct(p)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-mist"
                  >
                    <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded bg-mist">
                      {p.imageUrl && <Image src={p.imageUrl} alt="" fill className="object-contain" sizes="32px" />}
                    </span>
                    <span className="line-clamp-1 flex-1 text-ink">{p.name}</span>
                    <span className="whitespace-nowrap font-semibold text-navy">{formatTL(p.price)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <p className="mt-1 text-xs text-muted">Ürün bağlarsanız kampanyaya tıklayan müşteri o ürün sayfasına gider.</p>
      </div>

      {/* Görsel */}
      <div>
        <p className="mb-1.5 text-sm font-medium text-ink">Kampanya Görseli</p>
        <ImageUpload defaultUrl={imageUrl} onChange={setImageUrl} />
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-ink">Başlık *</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-lg border border-line bg-paper px-3 py-2.5 outline-none focus:border-orange" />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-ink">Açıklama</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="rounded-lg border border-line bg-paper px-3 py-2.5 outline-none focus:border-orange" />
      </label>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Kampanya Fiyatı (₺)</span>
          <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" step="0.01" className="rounded-lg border border-line bg-paper px-3 py-2 outline-none focus:border-orange" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Eski Fiyat (₺)</span>
          <input value={compareAt} onChange={(e) => setCompareAt(e.target.value)} type="number" step="0.01" className="rounded-lg border border-line bg-paper px-3 py-2 outline-none focus:border-orange" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Rozet</span>
          <input value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="%30, YENİ…" className="rounded-lg border border-line bg-paper px-3 py-2 outline-none focus:border-orange" />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Başlangıç Tarihi</span>
          <input type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="rounded-lg border border-line bg-paper px-3 py-2 outline-none focus:border-orange" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Bitiş (Geçerlilik) Tarihi</span>
          <input type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className="rounded-lg border border-line bg-paper px-3 py-2 outline-none focus:border-orange" />
        </label>
      </div>
      <p className="-mt-2 text-xs text-muted">
        Boş bırakılırsa süresiz geçerlidir. Bitiş tarihi geçince kampanya otomatik olarak yayından kalkar.
      </p>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="accent-orange" />
        Yayınla (kampanyalar sayfasında görünsün)
      </label>

      <button
        onClick={save}
        disabled={pending}
        className="rounded-lg bg-orange px-6 py-2.5 font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
      >
        {pending ? "Kaydediliyor…" : campaign ? "Kaydet" : "Kampanyayı Oluştur"}
      </button>
    </div>
  );
}
