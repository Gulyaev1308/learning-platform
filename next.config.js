/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // КРИТИЧЕСКИ ВАЖНО ДЛЯ DOCKER
  experimental: {
    proxyClientMaxBodySize: '500mb',
  },
}

module.exports = nextConfig
