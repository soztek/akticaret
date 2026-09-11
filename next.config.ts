import type { NextConfig } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

/**
 * NEXT_PUBLIC_APP_URL canonical (asıl) alan adına ayarlandığında, alternatif
 * host'ları (vercel.app ve apex) 301 ile ona yönlendirir. Env ayarlanmadan
 * (ör. localhost) hiçbir yönlendirme eklenmez → mevcut çalışma bozulmaz.
 */
function canonicalRedirects() {
  if (!APP_URL) return [];
  let host: string;
  try {
    host = new URL(APP_URL).host;
  } catch {
    return [];
  }
  if (!host || host.startsWith("localhost")) return [];

  const altHosts = new Set<string>();
  altHosts.add("akticaret.vercel.app");
  if (host.startsWith("www.")) altHosts.add(host.slice(4)); // apex → www
  altHosts.delete(host); // canonical host'u asla kendine yönlendirme (döngü koruması)

  return [...altHosts].map((h) => ({
    source: "/:path*",
    has: [{ type: "host" as const, value: h }],
    destination: `${APP_URL}/:path*`,
    permanent: true,
  }));
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // 2M Kale ürün görselleri (DigitalOcean Spaces CDN)
      { protocol: "https", hostname: "b2bc.ams3.cdn.digitaloceanspaces.com" },
      { protocol: "https", hostname: "*.digitaloceanspaces.com" },
      // Yüklenen görseller (Vercel Blob)
      { protocol: "https", hostname: "*.blob.vercel-storage.com" },
    ],
  },
  async redirects() {
    return canonicalRedirects();
  },
};

export default nextConfig;
