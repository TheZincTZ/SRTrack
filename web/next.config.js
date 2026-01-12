/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_TIMEZONE: process.env.NEXT_PUBLIC_TIMEZONE || 'Asia/Singapore',
  },
}

module.exports = nextConfig

