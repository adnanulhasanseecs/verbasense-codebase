import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Tree-shake icon/chart barrels so dev compile and prod bundles stay smaller
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  async redirects() {
    return [{ source: "/admin/rbac", destination: "/dashboard", permanent: false }];
  },
};

export default nextConfig;
