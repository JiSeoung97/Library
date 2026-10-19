import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react-swc';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');

	return {
		plugins: [
			tanstackRouter({
				target: 'react',
				autoCodeSplitting: true,
				routesDirectory: './src/pages',
				generatedRouteTree: './src/routeTree.gen.ts',
			}),
			react(),
			tailwindcss(),
		],
		resolve: {
			alias: {
				'@': '/src',
			},
		},
		server: {
			port: Number(env.VITE_DEV_PORT) || 3400,
		},
	};
});
