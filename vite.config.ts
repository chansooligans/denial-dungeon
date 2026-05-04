import { defineConfig } from 'vite'

const base = process.env.VITE_BASE ?? (process.env.NODE_ENV === 'production' ? '/denial-dungeon/' : '/')

export default defineConfig({
  base,
})
