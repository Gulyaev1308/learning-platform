/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  experimental: {
    proxyClientMaxBodySize: '1000mb',
  },
}

module.exports = nextConfig
