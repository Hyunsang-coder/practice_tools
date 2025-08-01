import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
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

  // Cloudflare Pages에서는 base path가 필요 없음
  if (command === 'build') {
    // GitHub Pages vs Cloudflare Pages 구분
    const isCloudflare = process.env.CF_PAGES === '1' || mode === 'cloudflare';
    
    if (!isCloudflare) {
      config.base = '/practice_tools/'; // GitHub Pages용
    }
    // Cloudflare Pages는 루트 경로 '/' 사용
    
    // 빌드 최적화
    config.build = {
      // 코드 스플리팅 최적화
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            audio: ['wasm-media-encoders'],
          }
        }
      },
      // 압축 최적화
      minify: 'esbuild',
      // 소스맵 생성 (디버깅용)
      sourcemap: mode !== 'production'
    };
  }

  return config;
});