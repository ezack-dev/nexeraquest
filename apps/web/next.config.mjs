/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@nexeraquest/types',
    '@nexeraquest/config',
    '@nexeraquest/database',
    '@nexeraquest/ledger',
    '@nexeraquest/verification',
    '@nexeraquest/fraud',
    '@nexeraquest/notifications',
    '@nexeraquest/auth',
  ],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'ipfs.io' },
    ],
  },
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      bufferutil: 'commonjs bufferutil',
    });
    return config;
  },
};

export default nextConfig;
