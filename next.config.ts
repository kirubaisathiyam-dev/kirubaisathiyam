import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/admin/cms",
        destination: "/admin/cms/index.html",
        permanent: false,
      },
      {
        source: "/admin/cms",
        destination: "/admin/cms/index.html",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
