import { nodeResolve } from '@rollup/plugin-node-resolve';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';
import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

const isWatch = process.env.ROLLUP_WATCH;

export default {
    input: 'src/main.js',
    output: {
        file: 'dist/bundle.js',
        format: 'iife',        // Формат «самовызывающейся функции» — идеален для браузера
        sourcemap: true,
        // УДАЛЯЕМ отсюда любые упоминания globals и внешних модулей!
    },
    plugins: [
        // nodeResolve обязан идти самым первым в массиве плагинов!
        nodeResolve({
            browser: true,
            preferBuiltins: false
        }),

        // commonjs идет строго вторым, он подружит модули Three.js со сборщиком
        commonjs(),

        json(),

        isWatch && serve({
            contentBase: 'dist',
            port: 3000,
            open: true
        }),

        isWatch && livereload({
            watch: 'dist',
            delay: 300
        }),

        !isWatch && terser()
    ].filter(Boolean)
};
