import type { NextConfig } from "next";

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
};

export default nextConfig;
