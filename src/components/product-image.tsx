import Image from "next/image";
import { clsx } from "clsx";

/** Ürün görseli yoksa marka amblemli zarif yer tutucu gösterir. */
export function ProductImage({
  src,
  alt,
  className,
  sizes,
}: {
  src: string | null;
  alt: string;
  className?: string;
  sizes?: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes ?? "(max-width:768px) 50vw, 25vw"}
        className={clsx("object-contain", className)}
      />
    );
  }
  return (
    <div
      className={clsx(
        "flex h-full w-full items-center justify-center bg-gradient-to-br from-mist to-line",
        className,
      )}
    >
      <Image
        src="/logo-mark.png"
        alt={alt}
        width={72}
        height={72}
        className="opacity-25 grayscale"
      />
    </div>
  );
}
