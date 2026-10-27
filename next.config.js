/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['mysql2', 'mongodb', 'bcryptjs']
  }
};

module.exports = nextConfig;

