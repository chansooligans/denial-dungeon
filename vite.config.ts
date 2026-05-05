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
      output: {
        // Pull Phaser into its own vendor chunk. The framework is the
        // bulk of the bundle (~1.3 MB) and never changes between
        // deploys, so an immutable filename means returning visitors
        // re-use the cached copy and only re-download the much smaller
        // game-logic chunk when we ship updates.
        manualChunks(id) {
          if (id.includes('node_modules/phaser')) return 'phaser'
        },
      },
    },
    // Bumped explicitly because phaser is a known-large vendor chunk;
    // we don't want the > 500 kB warning on every build.
    chunkSizeWarningLimit: 1500,
  },
})
