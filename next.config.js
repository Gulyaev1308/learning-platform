/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    // Оставляем только эту опцию, как требует сборщик Next.js
    proxyClientMaxBodySize: '4gb',
  },
}

module.exports = nextConfig;
