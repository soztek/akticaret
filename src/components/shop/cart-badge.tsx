"use client";

import { useEffect, useState } from "react";
import { cartCount, onCartChange } from "@/lib/cart-client";

export function CartBadge() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const update = () => setCount(cartCount());
    update();
    return onCartChange(update);
  }, []);

  if (count <= 0) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange px-1 text-[10px] font-bold text-white">
      {count}
    </span>
  );
}
