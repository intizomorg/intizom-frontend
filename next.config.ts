/** @type {import('next').NextConfig} */
module.exports = {
  async rewrites() {
    return [
      {
        source: "/media/:path*",
        destination: "http://localhost:5000/media/:path*"
      }
    ];
  }
};
