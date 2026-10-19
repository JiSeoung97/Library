import ModalConfirm from '@/components/ui/modals/ModalConfirm';
import { registerConfirm, type IConfirmOptions, type TConfirm } from '@/utils/common/confirm';
import { createContext, use, useCallback, useLayoutEffect, useState, type ReactNode } from 'react';

interface IPendingConfirm {
	options: IConfirmOptions;
	resolve: (result: boolean) => void;
}

const ConfirmContext = createContext<TConfirm | null>(null);

/** 앱 전역에서 하나의 확인 다이얼로그를 공유한다 (mes_FE ConfirmGuardProvider 축소판 — 페이지 이탈 가드는 제외) */
export const ConfirmGuardProvider = ({ children }: { children: ReactNode }) => {
	const [pending, setPending] = useState<IPendingConfirm | null>(null);

	const confirm = useCallback<TConfirm>(
		options =>
			new Promise<boolean>(resolve => {
				setPending(prev => {
					prev?.resolve(false);
					return { options: options ?? {}, resolve };
				});
			}),
		[],
	);

	useLayoutEffect(() => {
		registerConfirm(confirm);
		return () => registerConfirm(null);
	}, [confirm]);

	const close = (result: boolean) => {
		pending?.resolve(result);
		setPending(null);
	};

	return (
		<ConfirmContext value={confirm}>
			{children}
			<ModalConfirm
				open={!!pending}
				{...pending?.options}
				onConfirm={() => close(true)}
				onClose={() => close(false)}
			/>
		</ConfirmContext>
	);
};

export const useConfirm = (): TConfirm => {
	const ctx = use(ConfirmContext);
	if (!ctx) throw new Error('useConfirm must be used within a ConfirmGuardProvider');
	return ctx;
};
