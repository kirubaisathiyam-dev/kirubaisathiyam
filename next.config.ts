import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
