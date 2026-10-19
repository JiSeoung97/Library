import { ConfirmGuardProvider } from '@/contexts/ConfirmGuardProvider';
import NotFoundComponent from '@/pages/-routeComponents/NotFoundComponent';
import { createRootRoute, Outlet } from '@tanstack/react-router';

const Component = () => (
	<ConfirmGuardProvider>
		<Outlet />
	</ConfirmGuardProvider>
);

export const Route = createRootRoute({
	component: Component,
	notFoundComponent: NotFoundComponent,
});
