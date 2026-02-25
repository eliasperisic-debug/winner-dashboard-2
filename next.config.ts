import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' http://localhost:* https://*.amazonaws.com https://*.awsapprunner.com *",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
