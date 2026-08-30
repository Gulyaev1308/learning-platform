/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    proxyClientMaxBodySize: '500mb',
  },
}

module.exports = nextConfig
