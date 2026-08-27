/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  experimental: {
    proxyClientMaxBodySize: '500mb',
  },
}

module.exports = nextConfig
