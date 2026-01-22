import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/residents": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
      "/units": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
      "/payments": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
      "/available-units": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
      // Add more API routes here as you build them:
      // "/leases": { target: "http://localhost:3000", changeOrigin: true, secure: false },
      // "/resident-lookup": { target: "http://localhost:3000", changeOrigin: true, secure: false },
    },
  },
});
