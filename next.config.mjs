/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yemekhane.cu.edu.tr',
        pathname: '/yemekler/**',
      },
    ],
  },
}

const withPWA = (await import("@ducanh2912/next-pwa")).default({
  dest: "public",
  disable: false, // process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
})

export default withPWA(nextConfig)
