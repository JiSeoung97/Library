import LocaleProvider from '@/contexts/LocaleProvider';
import MswProvider from '@/contexts/MswProvider';
import QueryProvider from '@/contexts/QueryProvider';
import RouterProvider from '@/contexts/RouterProvider';
import '@/index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Provider 순서는 mes_FE 와 동일 — Msw → Query → Locale → Router
createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<MswProvider>
			<QueryProvider>
				<LocaleProvider>
					<RouterProvider />
				</LocaleProvider>
			</QueryProvider>
		</MswProvider>
	</StrictMode>,
);
