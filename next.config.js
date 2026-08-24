/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  turbopack: {},
  experimental: {
    proxyClientMaxBodySize: '100mb',
  },
}

module.exports = nextConfig
