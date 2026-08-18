import path from "node:path";
import type { NextConfig } from "next";

const config: NextConfig = {
  // There is a stray package-lock.json above this directory, and without this
  // Next infers the home folder as the workspace root and traces the wrong tree.
  outputFileTracingRoot: path.join(__dirname),

  images: { formats: ["image/webp"] },

  async headers() {
    return [
      {
        // The frame sequence is immutable — cache it hard at the edge.
        source: "/frames/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default config;
