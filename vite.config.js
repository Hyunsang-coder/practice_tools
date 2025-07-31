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
    server: {
      // SPA 라우팅을 위한 폴백 설정
      historyApiFallback: true,
    },
  };

  if (command === 'build') {
    config.base = '/practice_tools/'; // GitHub Pages 레포 이름에 맞춤
  }

  return config;
});