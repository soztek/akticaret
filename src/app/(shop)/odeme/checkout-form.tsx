"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Landmark, CreditCard, Wallet, Loader2 } from "lucide-react";
import { formatTL } from "@/lib/format";
import { computeTotals } from "@/lib/order-calc";
import { getCart, clearCart, onCartChange, type CartLine } from "@/lib/cart-client";
import { createOrderAction } from "@/lib/actions/orders";

type Method = "BANK_TRANSFER" | "CARD" | "ACCOUNT";

export function CheckoutForm({
  isDealer,
  loggedIn,
  defaults,
}: {
  isDealer: boolean;
  loggedIn: boolean;
  defaults: { name: string; phone: string; city: string; district: string; address: string };
}) {
  const router = useRouter();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [mounted, setMounted] = useState(false);
  const [method, setMethod] = useState<Method>("BANK_TRANSFER");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const [form, setForm] = useState(defaults);
  const [note, setNote] = useState("");

  useEffect(() => {
    setMounted(true);
    const refresh = () => setLines(getCart());
    refresh();
    return onCartChange(refresh);
  }, []);

  if (!mounted) return <p className="text-muted">Yükleniyor…</p>;

  if (lines.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-paper p-10 text-center">
        <p className="text-muted">Sepetiniz boş.</p>
        <Link href="/" className="mt-4 inline-block rounded-lg bg-orange px-5 py-2.5 font-semibold text-white">
          Alışverişe Başla
        </Link>
      </div>
    );
  }

  const totals = computeTotals(lines.map((l) => ({ price: l.price, qty: l.qty, vatRate: l.vatRate })));

  function submit() {
    setError(null);
    start(async () => {
      const res = await createOrderAction({
        items: lines.map((l) => ({ productId: l.productId, qty: l.qty })),
        billingName: form.name,
        billingPhone: form.phone,
        billingCity: form.city,
        billingDistrict: form.district,
        billingAddress: form.address,
        paymentMethod: method,
        note,
      });
      if (res.ok) {
        clearCart();
        router.push(`/siparis/${res.orderNumber}`);
      } else {
        setError(res.error);
      }
    });
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const Field = ({ label, k, type = "text", full }: { label: string; k: keyof typeof form; type?: string; full?: boolean }) => (
    <label className={`flex flex-col gap-1.5 text-sm ${full ? "sm:col-span-2" : ""}`}>
      <span className="font-medium text-ink">{label}</span>
      <input
        type={type}
        value={form[k]}
        onChange={set(k)}
        className="rounded-lg border border-line bg-paper px-3 py-2.5 outline-none focus:border-orange"
      />
    </label>
  );

  const methods: { id: Method; label: string; desc: string; icon: React.ElementType; show: boolean }[] = [
    { id: "BANK_TRANSFER", label: "Havale / EFT", desc: "Sipariş sonrası banka bilgileri gösterilir.", icon: Landmark, show: true },
    { id: "CARD", label: "Kredi Kartı", desc: "Online kart ödemesi (yakında).", icon: CreditCard, show: true },
    { id: "ACCOUNT", label: "Cari Hesap (Vadeli)", desc: "Bayi cari hesabınıza işlenir.", icon: Wallet, show: isDealer },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        {error && <div className="rounded-lg bg-danger/10 px-4 py-2.5 text-sm font-medium text-danger">{error}</div>}

        {!loggedIn && (
          <div className="rounded-lg bg-navy/5 px-4 py-2.5 text-sm text-navy">
            Misafir olarak devam ediyorsunuz.{" "}
            <Link href="/giris?next=/odeme" className="font-semibold underline">Giriş yapın</Link> ya da devam edin.
          </div>
        )}

        {/* Teslimat */}
        <section className="rounded-xl border border-line bg-paper p-5">
          <h2 className="mb-4 font-bold text-ink">Teslimat Bilgileri</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Ad Soyad *" k="name" />
            <Field label="Telefon *" k="phone" type="tel" />
            <Field label="İl *" k="city" />
            <Field label="İlçe" k="district" />
            <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
              <span className="font-medium text-ink">Adres *</span>
              <textarea value={form.address} onChange={set("address")} rows={3} className="rounded-lg border border-line bg-paper px-3 py-2.5 outline-none focus:border-orange" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
              <span className="font-medium text-ink">Sipariş Notu (opsiyonel)</span>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="rounded-lg border border-line bg-paper px-3 py-2.5 outline-none focus:border-orange" />
            </label>
          </div>
        </section>

        {/* Ödeme yöntemi */}
        <section className="rounded-xl border border-line bg-paper p-5">
          <h2 className="mb-4 font-bold text-ink">Ödeme Yöntemi</h2>
          <div className="space-y-2">
            {methods.filter((m) => m.show).map((m) => (
              <label
                key={m.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                  method === m.id ? "border-orange bg-orange/5" : "border-line hover:border-navy"
                }`}
              >
                <input type="radio" name="method" checked={method === m.id} onChange={() => setMethod(m.id)} className="accent-orange" />
                <m.icon className="h-5 w-5 text-navy" />
                <span>
                  <span className="block text-sm font-semibold text-ink">{m.label}</span>
                  <span className="block text-xs text-muted">{m.desc}</span>
                </span>
              </label>
            ))}
          </div>
        </section>
      </div>

      {/* Özet */}
      <aside className="h-max rounded-xl border border-line bg-paper p-5">
        <h2 className="text-lg font-bold text-ink">Sipariş Özeti</h2>
        <ul className="mt-3 max-h-52 space-y-2 overflow-y-auto text-sm">
          {lines.map((l) => (
            <li key={l.productId} className="flex justify-between gap-2">
              <span className="line-clamp-1 text-muted">{l.qty}× {l.name}</span>
              <span className="whitespace-nowrap text-ink">{formatTL(l.price * l.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-line pt-3 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Ara Toplam</dt><dd>{formatTL(totals.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">KDV</dt><dd>{formatTL(totals.vatTotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Kargo</dt><dd className={totals.freeShipping ? "font-semibold text-success" : ""}>{totals.freeShipping ? "Bedava" : formatTL(totals.shipping)}</dd></div>
          <div className="flex justify-between border-t border-line pt-2"><dt className="text-base font-bold text-ink">Genel Toplam</dt><dd className="text-lg font-extrabold text-navy">{formatTL(totals.grandTotal)}</dd></div>
        </dl>
        <button
          onClick={submit}
          disabled={pending}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-orange px-6 py-3.5 font-bold text-white hover:bg-orange-600 disabled:opacity-60"
        >
          {pending ? <><Loader2 className="h-5 w-5 animate-spin" /> İşleniyor…</> : "Siparişi Tamamla"}
        </button>
        <p className="mt-2 text-center text-xs text-muted">Fiyatlar sipariş anında sunucuda doğrulanır.</p>
      </aside>
    </div>
  );
}
