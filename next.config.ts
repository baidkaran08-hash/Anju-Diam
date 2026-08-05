import type { NextConfig } from "next";

const config: NextConfig = {
  images: { formats: ["image/webp"] },
  async headers() {
    return [
      {
        // Frame sequence is immutable — cache it hard at the edge.
        source: "/frames/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default config;
