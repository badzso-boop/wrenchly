import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@wrenchly/types', '@wrenchly/schema', '@wrenchly/i18n'],

}

export default nextConfig
