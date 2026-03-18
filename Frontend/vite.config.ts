import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from "path";


export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.join(process.cwd(), '..'), '');
  return {
    define: {
      'process.env': env,
    },
    plugins: [react()],
  };
});
