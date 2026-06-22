/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Force Next.js to use Webpack instead of Turbopack
    return config;
  },
};

export default nextConfig;
