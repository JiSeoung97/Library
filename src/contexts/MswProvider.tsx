import { ENV_ENABLE_MSW } from '@/consts/common/envKeys';
import type { SetupWorker } from 'msw/browser';
import { Suspense, use, type ReactNode } from 'react';

let workerRef: SetupWorker | undefined;

const mockingEnabledPromise = ENV_ENABLE_MSW
	? import('@/mocks/browser').then(async ({ worker }) => {
			workerRef = worker;
			await worker.start({ onUnhandledRequest: 'bypass' });
		})
	: Promise.resolve();

if (import.meta.hot) {
	import.meta.hot.dispose(() => {
		workerRef?.stop();
	});
}

interface IProps {
	children: ReactNode;
}

const MswProviderInner = ({ children }: IProps) => {
	use(mockingEnabledPromise);
	return children;
};

export default function MswProvider({ children }: IProps) {
	return (
		<Suspense fallback={null}>
			<MswProviderInner>{children}</MswProviderInner>
		</Suspense>
	);
}
