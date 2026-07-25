import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["firebase-admin"],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@firebase/firestore": path.resolve(
        process.cwd(),
        "node_modules/@firebase/firestore/dist/index.esm2017.js"
      ),
    };
    return config;
  },
};

export default nextConfig;
