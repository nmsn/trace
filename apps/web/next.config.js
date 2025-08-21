/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    transpilePackages: ['@trace/core', '@trace/utils'],
  },
}

module.exports = nextConfig