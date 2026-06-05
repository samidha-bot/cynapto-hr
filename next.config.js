/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Allow builds to succeed even if there are TS type errors
    ignoreBuildErrors: true,
  },
  eslint: {
    // Skip ESLint during builds
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ["firebasestorage.googleapis.com", "lh3.googleusercontent.com"],
  },
};

module.exports = nextConfig;
