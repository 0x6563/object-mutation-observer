import { build } from 'esbuild';
build({
    entryPoints: ['./src/index.ts'],
    outfile: './dist/index.js',
    minify: false,
    sourcemap: true,
    bundle: true,
    format: 'esm'
}).catch(() => process.exit(1))