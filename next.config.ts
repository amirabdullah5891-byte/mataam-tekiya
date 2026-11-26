import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // لا نستخدم standalone في Vercel
  // output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // ملاحظة: خيار eslint أُزيل لأنه غير مدعوم في Next.js 16
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
