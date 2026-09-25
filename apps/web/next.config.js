/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@groundwave/types", "@groundwave/audio-core"],
};

module.exports = nextConfig;
