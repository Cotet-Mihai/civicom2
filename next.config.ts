import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'bslgppjjtfropjzccetj.supabase.co',
            }
        ],
    },
};

export default nextConfig;
