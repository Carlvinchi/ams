/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
    remotePatterns: [new URL('http://localhost:8000/uploads/profile_pictures/**')],
  },
};

export default nextConfig;
