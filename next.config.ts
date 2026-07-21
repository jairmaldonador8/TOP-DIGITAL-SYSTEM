import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Transiciones entre secciones con la View Transitions API (React
    // <ViewTransition>). Sin soporte del navegador, la navegación funciona
    // igual, solo sin animar.
    viewTransition: true,
  },
};

export default nextConfig;
