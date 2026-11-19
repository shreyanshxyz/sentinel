import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  turbopack: {
    root: "/home/shreyanshxyz/Dev/sentinel",
  },
  async redirects() {
    return [
      {
        source: "/search",
        destination: "/dashboard/search",
        permanent: true,
      },
      {
        source: "/analytics",
        destination: "/dashboard/analytics",
        permanent: true,
      },
      {
        source: "/settings",
        destination: "/dashboard/settings",
        permanent: true,
      },
      {
        source: "/logs/:id",
        destination: "/dashboard/logs/:id",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
