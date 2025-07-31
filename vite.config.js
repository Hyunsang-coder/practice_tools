import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
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
    config.base = '/interpretation_tools/';
  }

  return config;
});