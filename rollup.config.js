import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/wind-barb-card.ts',
  output: {
    file: 'dist/wind-barb-card.js',
    format: 'es',
    sourcemap: false
  },
  plugins: [
    resolve({
      browser: true,
      preferBuiltins: false
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json'
    }),
    terser({
      format: {
        comments: false
      }
    })
  ],
  external: []
};