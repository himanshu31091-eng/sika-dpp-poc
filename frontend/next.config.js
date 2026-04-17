/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    NEXT_PUBLIC_ADMIN_KEY: process.env.NEXT_PUBLIC_ADMIN_KEY || 'sika-admin-secret-change-in-prod',
  },
};

module.exports = nextConfig;
