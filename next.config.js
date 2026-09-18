/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    // Расширяем лимит буферизации прокси до 4 ГБ
    proxyClientMaxBodySize: '4gb',
    // Снимаем ограничения с middleware на размер входящего потока
    middlewareClientMaxBodySize: '4gb',
  },
}

module.exports = nextConfig;