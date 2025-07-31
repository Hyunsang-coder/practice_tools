import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
<<<<<<< Updated upstream
export default defineConfig({
  base: "/practice_tools/",
  plugins: [react()],
  css: {
    modules: {
      localsConvention: 'dashes',
      generateScopedName: '[name]__[local]___[hash:base64:5]',
    },
  },
});
=======
export default defineConfig(({ command }) => {
  const config = {
    plugins: [react()],
    css: {
      modules: {
        localsConvention: 'dashes',
        generateScopedName: '[name]__[local]___[hash:base64:5]',
      },
    },
  };

  if (command === 'build') {
    config.base = '/practice_tools/';
  }

  return config;
});
>>>>>>> Stashed changes
