export type TConfirmVariant = 'save' | 'delete' | 'warning' | 'info' | 'error';

export interface IConfirmOptions {
	variant?: TConfirmVariant;
	message?: string;
	labels?: { confirm?: string; close?: string };
}

export type TConfirm = (options?: IConfirmOptions) => Promise<boolean>;

let registered: TConfirm | null = null;

// ConfirmGuardProvider 가 마운트/언마운트 시 등록·해제한다
export const registerConfirm = (fn: TConfirm | null) => {
	registered = fn;
};

// React 밖(뮤테이션 onError 등)에서 확인 다이얼로그를 띄우는 진입점 — 컴포넌트는 useConfirm() 을 쓴다
export const confirm: TConfirm = options => {
	if (!registered)
		throw new Error('confirm 은 ConfirmGuardProvider 가 마운트된 뒤에만 호출할 수 있다');
	return registered(options);
};
