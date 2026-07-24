import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const port = parseInt(process.env.PORT ?? "5173", 10);
const basePath = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "docs"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    sourcemap: false,
    minify: "terser",
    target: "esnext",
    rollupOptions: {
      output: {
        manualChunks(id) {
          // ── React core ────────────────────────────────────────────────────
          if (id.includes("node_modules/react/") ||
              id.includes("node_modules/react-dom/") ||
              id.includes("node_modules/scheduler/")) {
            return "vendor-react";
          }

          // ── Routing ───────────────────────────────────────────────────────
          if (id.includes("node_modules/wouter/")) {
            return "vendor-router";
          }

          // ── Data fetching ─────────────────────────────────────────────────
          if (id.includes("node_modules/@tanstack/") ||
              id.includes("node_modules/axios/")) {
            return "vendor-query";
          }

          // ── Radix UI primitives ───────────────────────────────────────────
          if (id.includes("node_modules/@radix-ui/")) {
            return "vendor-ui";
          }

          // ── Rich text editor (heaviest single dep) ────────────────────────
          if (id.includes("node_modules/@tiptap/")) {
            return "vendor-editor";
          }

          // ── Charts ────────────────────────────────────────────────────────
          if (id.includes("node_modules/recharts/") ||
              id.includes("node_modules/d3-") ||
              id.includes("node_modules/victory-")) {
            return "vendor-charts";
          }

          // ── Markdown rendering ────────────────────────────────────────────
          if (id.includes("node_modules/react-markdown/") ||
              id.includes("node_modules/remark") ||
              id.includes("node_modules/rehype") ||
              id.includes("node_modules/unified/") ||
              id.includes("node_modules/micromark") ||
              id.includes("node_modules/mdast") ||
              id.includes("node_modules/hast") ||
              id.includes("node_modules/vfile")) {
            return "vendor-markdown";
          }

          // ── Theming + misc UI ─────────────────────────────────────────────
          if (id.includes("node_modules/next-themes/") ||
              id.includes("node_modules/class-variance-authority/") ||
              id.includes("node_modules/clsx/") ||
              id.includes("node_modules/tailwind-merge/") ||
              id.includes("node_modules/lucide-react/")) {
            return "vendor-ui-utils";
          }

          // ── Everything else in node_modules → general vendor chunk ────────
          if (id.includes("node_modules/")) {
            return "vendor-misc";
          }
        },
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
    // Raise the warning threshold — per-chunk warnings are now meaningful
    chunkSizeWarningLimit: 600,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ["console.log"],
      },
    },
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
      "/media": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
