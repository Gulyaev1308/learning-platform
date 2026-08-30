/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // КРИТИЧЕСКИ ВАЖНО ДЛЯ DOCKER
  serverExternalPackages: ['better-sqlite3'], // пока оставляем, если код еще ссылается на него
  experimental: {
    proxyClientMaxBodySize: '500mb',
  },
}

module.exports = nextConfig
