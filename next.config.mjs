const SUPABASE_PROJECT_ORIGIN = "https://qbeioesktbpvdlgzrgsm.supabase.co";
const SUPABASE_REALTIME_ORIGIN = "wss://qbeioesktbpvdlgzrgsm.supabase.co";

// The Supabase project ref is public routing metadata, not a credential. Keeping
// these origins explicit makes a project migration require a deliberate CSP update.
const contentSecurityPolicyReportOnly = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  // Next.js emits inline bootstrap scripts; allow them while this policy is measured.
  "script-src 'self' 'unsafe-inline'",
  // Tailwind/React components use inline style attributes in the current app.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  `connect-src 'self' ${SUPABASE_PROJECT_ORIGIN} ${SUPABASE_REALTIME_ORIGIN}`,
  "font-src 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy-Report-Only",
    value: contentSecurityPolicyReportOnly,
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  { key: "X-Frame-Options", value: "DENY" },
];

const serviceWorkerHeaders = [
  { key: "Content-Type", value: "application/javascript; charset=utf-8" },
  { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: serviceWorkerHeaders,
      },
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
