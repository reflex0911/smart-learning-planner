import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

export default defineConfig({
  plugins: [react()],

  // ✅ proxy for backend routes in dev
  server: {
    proxy: {
      "/ai": {
        target: "http://localhost:5001",
        changeOrigin: true,
      },
    },
  },

  // ✅ tailwind + autoprefixer
  css: {
    postcss: {
      plugins: [
        tailwindcss({ config: "./tailwind.config.cjs" }),
        autoprefixer(),
      ],
    },
  },
});