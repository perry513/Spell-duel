import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base must match the GitHub Pages repo name or built asset URLs 404
export default defineConfig({
  base: '/spell-duel/',
  plugins: [react()],
})
