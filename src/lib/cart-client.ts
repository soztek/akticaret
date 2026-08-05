"use client";

// ============================================================
// İstemci tarafı sepet (localStorage). FAZ 6'da sunucu sepeti + checkout
// bunun üzerine inşa edilecek. Fiyatlar checkout'ta SUNUCUDA doğrulanır.
// ============================================================

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  unit: string;
  imageUrl: string | null;
  qty: number;
};

const KEY = "ak_cart_v1";
const EVENT = "ak-cart-change";

export function getCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as CartLine[];
  } catch {
    return [];
  }
}

function save(lines: CartLine[]) {
  localStorage.setItem(KEY, JSON.stringify(lines));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function addToCart(line: Omit<CartLine, "qty">, qty = 1) {
  const lines = getCart();
  const existing = lines.find((l) => l.productId === line.productId);
  if (existing) existing.qty += qty;
  else lines.push({ ...line, qty });
  save(lines);
}

export function updateQty(productId: string, qty: number) {
  const lines = getCart().map((l) => (l.productId === productId ? { ...l, qty } : l));
  save(lines.filter((l) => l.qty > 0));
}

export function removeFromCart(productId: string) {
  save(getCart().filter((l) => l.productId !== productId));
}

export function clearCart() {
  save([]);
}

export function cartCount(): number {
  return getCart().reduce((n, l) => n + l.qty, 0);
}

export function onCartChange(cb: () => void): () => void {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
