import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const ctfdOrigin = env.VITE_CTFD_ORIGIN || "http://localhost:8000";

  return {
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  // No custom module aliases – keep the Vite configuration as
  // minimal and idiomatic as possible for a plain React project.
  // If you previously used `@` or `figma:` imports they have been
  // rewritten to standard relative paths in the source files.

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ["**/*.svg", "**/*.csv"],

  // Build configuration for CTFd theme deployment
  build: {
    outDir: "static",
    assetsDir: "assets",
    emptyOutDir: true,
  },
  base: "/themes/CyberSpark/static/",
    server: {
      proxy: {
        "/api": { target: ctfdOrigin, changeOrigin: true },
        "/login": { target: ctfdOrigin, changeOrigin: true },
        "/register": { target: ctfdOrigin, changeOrigin: true },
        "/logout": { target: ctfdOrigin, changeOrigin: true },
        "/admin": { target: ctfdOrigin, changeOrigin: true },
        "/ctfd-page": {
          target: ctfdOrigin,
          changeOrigin: true,
          rewrite: () => "/",
        },
      },
    },
  };
});
