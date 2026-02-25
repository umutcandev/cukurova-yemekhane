/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
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
  // Servis worker yalnızca production'da aktif.
  // Development'ta açık bırakmak gereksiz Edge Request ve cache sorunlarına yol açar.
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
})

export default withPWA(nextConfig)
