import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel 배포 시 /api/v1/* 는 vercel.json rewrites가 Python 서버리스로 처리
  // 로컬 개발 시만 백엔드 프록시 사용
  async rewrites() {
    if (process.env.NODE_ENV === "development") {
      return [
        {
          source: "/api/:path*",
          destination: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/:path*`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
