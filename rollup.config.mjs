import { nodeResolve } from '@rollup/plugin-node-resolve';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';
import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

// ЖЕСТКАЯ ПРОВЕРКА: Если мы на хостинге (production), то watch принудительно отключается
const isProduction = process.env.NODE_ENV === 'production' || !process.env.ROLLUP_WATCH;
const isWatch = !isProduction;

export default {
    input: 'src/main.js',
    output: {
        file: 'dist/bundle.js',
        format: 'iife',        
        sourcemap: isWatch // Карты кода включаем только для локальной разработки    
    },
    plugins: [
        nodeResolve({
            browser: true,
            preferBuiltins: false 
        }),
        commonjs(),
        json(),

        // Локальный сервер запустится ТОЛЬКО на твоем ПК в режиме разработки
        isWatch && serve({
            contentBase: 'dist',
            port: 3000,
            open: true
        }),

        // Автообновление сработает ТОЛЬКО на твоем ПК
        isWatch && livereload({
            watch: 'dist',
            delay: 300
        }),

        // В облаке код гарантированно сожмется и процесс сборки закроется (exit 0)
        isProduction && terser()
    ].filter(Boolean)
};
