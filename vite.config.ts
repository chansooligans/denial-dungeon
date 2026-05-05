import { defineConfig } from 'vite'
import { resolve } from 'path'

const base = process.env.VITE_BASE ?? (process.env.NODE_ENV === 'production' ? '/denial-dungeon/' : '/')

export default defineConfig({
  base,
  build: {
    rollupOptions: {
      input: {
        // Game: the existing entry point.
        main: resolve(__dirname, 'index.html'),
        // Battle catalog: a static, framework-free design surface that
        // lists every encounter + linked claim. Lives at /battles.html
        // on GitHub Pages.
        battles: resolve(__dirname, 'battles.html'),
      },
    },
  },
})
