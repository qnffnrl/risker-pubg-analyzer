/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/risker-pubg-analyzer',
  // output: 'standalone' is used in production Docker builds.
  // In local development (non-CI), symlink creation may fail on Windows
  // without Developer Mode or admin privileges, so we enable it only in CI/production.
  ...(process.env.NEXT_STANDALONE === 'true' ? { output: 'standalone' } : {}),
}

export default nextConfig
