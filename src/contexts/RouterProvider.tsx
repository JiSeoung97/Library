import ErrorComponent from '@/pages/-routeComponents/ErrorComponent';
import { routeTree } from '@/routeTree.gen';
import {
	createRouter as tanstackCreateRouter,
	RouterProvider as TanStackRouterProvider,
} from '@tanstack/react-router';

export const createRouter = () =>
	tanstackCreateRouter({
		routeTree,
		defaultPreload: 'intent',
		// 화면 렌더링 중 오류가 나면 라우터 기본(영문) 화면 대신 한국어 안내를 보여준다
		defaultErrorComponent: ErrorComponent,
	});

export type TAppRouter = ReturnType<typeof createRouter>;

declare module '@tanstack/react-router' {
	interface Register {
		router: TAppRouter;
	}
}

const router = createRouter();

const RouterProvider = () => <TanStackRouterProvider router={router} />;

export default RouterProvider;
