// import { fileURLToPath } from 'url';
import path from 'path';
import { configDefaults, defineConfig } from 'vitest/config';
// console.log("aaaaa", fileURLToPath(import.meta.url));
export default defineConfig({
  test: {
    globals: true,
    exclude: [...configDefaults.exclude, '**/playwright/**'],
    alias: {
      '~': path.resolve(__dirname, './src'),
      prisma: path.resolve(__dirname, './prisma')
    }
    //setupFiles: ['dotenv/config'],
  }
});
