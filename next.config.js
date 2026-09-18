/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    // Увеличиваем лимит проксирования тела запроса до 2 ГБ
    proxyClientMaxBodySize: '2gb',
  },
}

module.exports = nextConfig
