// next.config.js
module.exports = {
  images: {
      remotePatterns: [
          {
              protocol: 'http',
              hostname: 'localhost',
              port: '3005',
              pathname: '/**',
          },
      ],
  },
};