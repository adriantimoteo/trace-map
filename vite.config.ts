import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Relative base so the build works when served from a GitHub Pages
  // project subpath (https://<user>.github.io/trace-map/) as well as
  // from the root — leave it as "/" for local dev.
  base: command === 'build' ? './' : '/',
}))
