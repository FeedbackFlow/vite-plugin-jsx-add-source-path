import {defineConfig} from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
    plugins: [dts({rollupTypes: true })],
    build: {
        minify: false,
        // Transpile as little as possible.
        // The bundler of the person installing our package will transpile and minify.
        target: 'esnext',
        lib: {
            entry: './src/main.ts',
            formats: ['es'],
            fileName: 'index'
        },
    },
})

