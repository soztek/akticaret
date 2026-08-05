import Image from "next/image";
import Link from "next/link";
import { clsx } from "clsx";

/**
 * AK TİCARET logosu. Mevcut kurumsal logo (siyah "A" ev amblemi + mavi detay,
 * "AK TİCARET / Yapı Malzemeleri"). Logo koyu renk olduğundan koyu lacivert
 * zeminde beyaz kutu içinde gösterilir (variant="boxed").
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
        <Image src="/logo-mark.png" alt="AK TİCARET" width={44} height={44} priority={priority} />
      </Link>
    );
  }

  const img = (
    <Image
      src="/logo.png"
      alt="AK TİCARET Yapı Malzemeleri"
      width={200}
      height={53}
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
        <span className="rounded-lg bg-paper px-3 py-1.5">{img}</span>
      ) : (
        img
      )}
    </Link>
  );
}
