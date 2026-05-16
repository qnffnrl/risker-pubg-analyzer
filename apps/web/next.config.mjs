/** @type {import('next').NextConfig} */
const nextConfig = {
  // 서브도메인(pubg.risker.co.kr) 운영 — basePath 불필요
  ...(process.env.NEXT_STANDALONE === 'true' ? { output: 'standalone' } : {}),
}

export default nextConfig
