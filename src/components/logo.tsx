import Image from "next/image";
import Link from "next/link";
import { clsx } from "clsx";

/**
 * AK GRUP YAPI logosu ("A" ev amblemi + mavi detay, "AK GRUP YAPI LTD. ŞTİ.").
 * Logo koyu renk + beyaz zeminli olduğundan koyu lacivert zeminde beyaz kutu
 * içinde gösterilir (variant="boxed").
 */
export function Logo({
  variant = "plain",
  className,
  priority,
}: {
  /** "plain": açık zeminde düz | "boxed": koyu zeminde beyaz kutu | "mark": sadece amblem */
  variant?: "plain" | "boxed" | "mark";
  className?: string;
  priority?: boolean;
}) {
  if (variant === "mark") {
    return (
      <Link href="/" className={clsx("inline-flex", className)} aria-label="AK TİCARET ana sayfa">
        <Image src="/logo-mark.png" alt="AK GRUP YAPI" width={44} height={44} priority={priority} />
      </Link>
    );
  }

  const img = (
    <Image
      src="/logo.png"
      alt="AK GRUP YAPI"
      width={900}
      height={301}
      priority={priority}
      className="h-10 w-auto sm:h-11"
    />
  );

  return (
    <Link
      href="/"
      className={clsx("inline-flex items-center", className)}
      aria-label="AK TİCARET ana sayfa"
    >
      {variant === "boxed" ? (
        <span className="rounded-lg bg-gradient-to-br from-[#eef1f6] to-[#d9dfe8] px-3 py-1.5">{img}</span>
      ) : (
        img
      )}
    </Link>
  );
}
