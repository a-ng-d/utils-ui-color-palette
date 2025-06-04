import { fileURLToPath } from 'url'
import path, { resolve } from 'path'
import { defineConfig } from 'vitest/config'
import dts from 'vite-plugin-dts'
import { globSync } from 'glob'

export default defineConfig({
  plugins: [
    dts({
      exclude: ['./src/test', './src/modules/**/*.test.ts'],
    }),
  ],
  resolve: {
    alias: {
      '@modules': path.resolve(__dirname, './src/modules'),
      '@tps': path.resolve(__dirname, './src/types'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, './src/index.ts'),
      formats: ['es'],
    },
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: Object.fromEntries(
        globSync(['./src/index.ts', './src/modules/**/*.ts'])
          .filter((file) => !/\.test\.ts$/.test(file))
          .map((file) => {
            const entryName = path.relative(
              'src',
              file.slice(0, file.length - path.extname(file).length)
            )
            const entryUrl = fileURLToPath(new URL(file, import.meta.url))
            return [entryName, entryUrl]
          })
      ),
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'src/modules/**/*.test.ts',
        'src/test/*.ts',
        '.eslintrc.cjs',
        'src/index.ts',
        'src/**/*.d.ts',
      ],
    },
  },
})
