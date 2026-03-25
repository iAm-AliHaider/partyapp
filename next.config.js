const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  fallbacks: {
    document: "/offline",
    image: "/icons/party-logo.png",
    font: "/icons/party-logo.png",
    audio: "/icons/party-logo.png",
    video: "/icons/party-logo.png",
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = withPWA({
  reactStrictMode: true,
  output: "standalone",
});

module.exports = nextConfig;
