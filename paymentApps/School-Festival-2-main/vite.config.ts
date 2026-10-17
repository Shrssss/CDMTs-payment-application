import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Spring Boot が配信する場所へ直接出力する。管理画面の静的ファイルは残す。
    outDir: "../src/main/resources/static",
    emptyOutDir: false,
  },
  server: {
  port: 3000,
  proxy: {
    "/api": {
      target: "http://localhost:8080",
      changeOrigin: true,
    },
  },
},
});
