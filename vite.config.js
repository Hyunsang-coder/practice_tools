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

  // 빌드 설정 - 플랫폼별 분기
  if (command === 'build') {
    // Cloudflare Pages 감지 (환경변수 또는 mode로)
    const isCloudflare = process.env.CF_PAGES === '1' || 
                        process.env.NODE_ENV === 'production' ||
                        mode === 'production';
    
    if (!isCloudflare) {
      // GitHub Pages용 base path
      config.base = '/practice_tools/';
    }
    
    // 빌드 최적화 (간단하고 안전한 설정)
    config.build = {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild',
      target: 'es2020',
      rollupOptions: {
        output: {
          // 간단한 청크 분할
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'router': ['react-router-dom'],
          }
        }
      }
    };
  }

  return config;
});