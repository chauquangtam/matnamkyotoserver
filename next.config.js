const path = require('path');
const intercept = require("intercept-stdout")
function interceptStdout(text) {
    if (text.includes("Duplicate atom key")) {
        return ""
    }
    return text
}

if (process.env.NODE_ENV === "development") {
    intercept(interceptStdout)
}
/** @type {import('next').NextConfig} */
module.exports = {
    reactStrictMode: true,
    webpack: (config) => {
        config.resolve.alias['~'] = path.resolve(__dirname, 'src');

        config.module.rules.push({
            test: /\.svg$/i,
            issuer: /\.[jt]sx?$/,
            use: ['@svgr/webpack'],
        });

        return config;
    },
    images: {
        domains: ['st.nettruyenco.com', 'st.ntcdntempv3.com'],
        minimumCacheTTL: 24 * 60 * 60 * 7,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
};
