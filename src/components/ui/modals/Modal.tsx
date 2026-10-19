import { useConfirm } from '@/contexts/ConfirmGuardProvider';
import { FormModalProvider } from '@/contexts/FormModalProvider';
import { cn } from '@/utils/common/cn';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SaveIcon from '@mui/icons-material/Save';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
	Button,
	IconButton,
	Modal as MuiModal,
	Popover,
	Typography,
	type ButtonProps,
} from '@mui/material';
import {
	useId,
	useMemo,
	useRef,
	useState,
	type ElementType,
	type ReactNode,
	type SubmitEventHandler,
} from 'react';
import {
	createFormControl,
	useFormState,
	type Control,
	type FieldValues,
	type UseFormReturn,
} from 'react-hook-form';
import type { ZodType } from 'zod';

/**
 * size → 폭. 작은 화면에서는 거의 전체 폭(98%), lg(1024px) 이상에서만 비율 폭을 쓴다 (mes_FE 와 같은 값).
 * 폼 칸이 적으면 xsmall · small, 표가 들어가면 medium 이상.
 */
export const SIZE_WIDTHS = {
	xsmall: 'w-[98%] lg:w-3/10',
	small: 'w-[98%] lg:w-4/10',
	medium: 'w-[98%] lg:w-6/10',
	large: 'w-[98%] lg:w-8/10',
	xlarge: 'w-[98%] lg:w-9/10',
	full: 'w-[98%]',
} as const;

export type TSize = keyof typeof SIZE_WIDTHS;

export type TModalConfirmVariant = 'save' | 'delete' | 'warning' | 'info' | 'error';

export interface IVariantButton {
	/** 확인창(ModalConfirm)의 제목 */
	title: string;
	Icon: ElementType;
	color: ButtonProps['color'];
	/** 확인창 가운데 아이콘의 배경색 */
	iconBgClassName: string;
	confirmLabel: string;
	closeLabel: string;
	/** 확인 버튼이 있는가 — info · error 는 보여 주기만 하므로 닫기 버튼만 둔다 */
	hasConfirm: boolean;
	/** 확인창 기본 문구 */
	message: string;
}

/**
 * 모달의 "성격"별 버튼 · 문구 · 색 — Modal 과 ModalConfirm 이 같은 표를 본다 (mes_FE VARIANT_BUTTONS 와 같은 값).
 * 화면은 `variant='save'` 만 적으면 되고, 버튼 이름 · 아이콘 · 색을 화면마다 다시 정하지 않는다.
 */
export const VARIANT_BUTTONS: Record<TModalConfirmVariant, IVariantButton> = {
	save: {
		title: '저장 확인',
		Icon: SaveIcon,
		color: 'primary',
		iconBgClassName: 'bg-blue-600',
		confirmLabel: '저장',
		closeLabel: '취소',
		hasConfirm: true,
		message: '저장하시겠습니까?',
	},
	delete: {
		title: '삭제 확인',
		Icon: DeleteIcon,
		color: 'error',
		iconBgClassName: 'bg-red-700',
		confirmLabel: '삭제',
		closeLabel: '취소',
		hasConfirm: true,
		message: '정말 삭제하시겠습니까?',
	},
	warning: {
		title: '주의',
		Icon: WarningAmberIcon,
		color: 'warning',
		iconBgClassName: 'bg-orange-600',
		confirmLabel: '확인',
		closeLabel: '취소',
		hasConfirm: true,
		message: '계속 진행하시겠습니까?',
	},
	info: {
		title: '알림',
		Icon: CheckIcon,
		color: 'info',
		iconBgClassName: 'bg-sky-700',
		confirmLabel: '확인',
		closeLabel: '닫기',
		hasConfirm: false,
		message: '',
	},
	error: {
		title: '오류',
		Icon: ErrorOutlineIcon,
		color: 'error',
		iconBgClassName: 'bg-red-700',
		confirmLabel: '확인',
		closeLabel: '닫기',
		hasConfirm: false,
		message: '',
	},
};

/** 저장 처리기 — values 는 폼 전체 값, dirtiedValues 는 사용자가 실제로 바꾼 값만 */
export type TModalConfirmHandler<T extends FieldValues = FieldValues> = (
	values: T,
	dirtiedValues: Partial<T>,
) => unknown | Promise<unknown>;

/** 모든 모달 컴포넌트의 공통 props (mes_FE IModalBaseProps) — 대상은 항상 `data` 라는 이름으로 받는다 */
export interface IModalBaseProps<T = unknown> {
	open: boolean;
	/** 모달이 다루는 대상 (수정할 도서, 이력을 볼 회원 번호 등) */
	data: T;
	onClose: () => void;
}

export interface IModalProps<T extends FieldValues = FieldValues> {
	open: boolean;
	title: string;
	size?: TSize;
	/** 모달의 성격 — 'info'(기본)는 닫기 버튼만, 'save' 등은 확인 버튼이 생긴다 */
	variant?: TModalConfirmVariant;
	children?: ReactNode;
	/** 헤더 오른쪽(닫기 버튼 왼쪽)에 놓을 버튼들 */
	actions?: ReactNode;
	/** 기본 푸터(닫기 · 확인) 대신 그릴 푸터 */
	footer?: ReactNode;
	/** 푸터를 그릴지 (기본 true) */
	enableFooter?: boolean;
	/**
	 * 폼 모달이면 넘긴다. Modal 이 검증 → 저장 확인창 → onConfirm → 폼 초기화 → 닫기를 순서대로 해 준다.
	 * schema 는 "왜 저장 버튼이 눌리지 않는지" 사유를 뽑을 때 폼 전체를 다시 검증하는 데 쓴다.
	 */
	formProps?: { form: UseFormReturn<T>; schema: ZodType };
	/** 확인 버튼을 눌렀을 때 — 폼 모달이면 (values, dirtiedValues) 를 받는다 */
	onConfirm?: TModalConfirmHandler<T>;
	/** 확인 버튼 이름 바꾸기 (기본은 variant 의 이름) */
	confirmLabel?: string;
	/** 저장 확인창의 문구 바꾸기 (기본은 variant 의 문구) */
	confirmMessage?: string;
	/** 확인 버튼을 막는다 — 폼 검증과 별개로 화면 사정(예: 아이디 중복 확인 전)으로 막을 때 쓴다 */
	confirmDisabled?: boolean;
	/** confirmDisabled 로 막았을 때 사용자에게 보여 줄 이유 */
	confirmDisabledReason?: string;
	/** 확인 버튼을 눌러도 저장 확인창을 띄우지 않는다 */
	skipConfirm?: boolean;
	/** 바꾼 값이 없어도 확인을 허용한다 (기본은 변경이 있어야 저장할 수 있다) */
	skipDirtyCheck?: boolean;
	onClose: () => void;
}

// react-hook-form 은 isDirty 를 한 박자 늦게, dirtyFields 는 즉시 갱신한다 — 둘을 함께 봐야 "바꾼 값이 있는가"가 정확하다
const hasDirtyValues = (dirtyFields: object | undefined) =>
	!!dirtyFields && Object.values(dirtyFields).some(Boolean);

const isFormDirty = (formState: UseFormReturn<FieldValues>['formState'] | undefined) =>
	!!formState?.isDirty || hasDirtyValues(formState?.dirtyFields);

// 폼이 없는 모달에서도 useFormState 를 조건 없이 부를 수 있게 하는 빈 control (훅은 조건부로 부를 수 없다)
const { control: EMPTY_FORM_CONTROL } = createFormControl();

/**
 * 공통 모달 — 헤더(제목 · 닫기) / 본문 / 푸터(닫기 · 확인) 구조와 폼 저장 흐름을 한곳에서 정한다.
 * mes_FE Modal.tsx 를 옮겼다. 드래그 · 크기 조절 · 최소화 · 전체화면은 이 프로젝트 규모에서 뺐다.
 *
 * ■ 폼 모달이 Modal 에 맡기는 것 (화면마다 다시 짜지 않는다)
 *   1. 저장 버튼 활성 조건 — 검증을 통과했고(isValid), 바꾼 값이 있을 때만(dirty) 눌린다
 *   2. 눌리지 않는 이유 — 버튼 옆 ⓘ 를 누르면 사유 목록을 보여 준다
 *   3. 저장 확인창 — "저장하시겠습니까?" 를 거친 뒤 onConfirm 을 부른다
 *   4. 성공 후 정리 — 폼을 초기화하고 모달을 닫는다. 실패하면 모달을 그대로 둔다(입력값 유지)
 *   5. 닫기 보호 — 바꾼 값이 있는데 닫으려 하면 "변경사항이 저장되지 않습니다" 를 묻는다
 *   6. 이중 제출 방지 — 제출 중에는 버튼 · 닫기를 막는다
 */
const Modal = <T extends FieldValues = FieldValues>({
	open,
	title,
	size = 'medium',
	variant = 'info',
	formProps,
	onConfirm,
	confirmLabel,
	confirmMessage,
	confirmDisabled,
	confirmDisabledReason,
	skipConfirm,
	skipDirtyCheck,
	onClose,
	children,
	actions,
	footer,
	enableFooter = true,
}: IModalProps<T>) => {
	const { form, schema } = formProps ?? {};
	const confirm = useConfirm();
	const button = VARIANT_BUTTONS[variant];
	const { Icon } = button;
	const hasConfirmButton = button.hasConfirm;
	// 본문의 <form id> 와 푸터 저장 버튼의 form 속성을 잇는 값
	const formId = useId();

	// 폼이 없는 모달의 onConfirm 진행 상태 — 연타를 막는다 (폼 모달은 react-hook-form 의 isSubmitting 이 맡는다)
	const [isConfirming, setIsConfirming] = useState(false);
	const confirmingRef = useRef(false);

	// "왜 저장이 안 되는지" 팝오버가 붙을 자리 — 값이 있으면 열려 있는 것이다
	const [reasonsAnchorEl, setReasonsAnchorEl] = useState<null | HTMLElement>(null);

	// 폼 상태를 직접 구독한다(useFormState) — 입력할 때마다 이 컴포넌트가 다시 그려져 버튼 활성 여부가 바뀐다.
	// 주의: `form.formState` 를 직접 읽으면 안 된다. 그 값은 useForm 을 부른 컴포넌트(각 모달)가 다시 그려질 때만 갱신되는데,
	// 각 모달은 폼 상태를 읽지 않아 다시 그려지지 않는다 → 제출 시점에 "변경 없음"인 옛 상태를 보게 된다.
	// 그래서 아래 처리기들은 모두 여기서 구독한 최신 상태(formState)를 쓴다.
	const subscribedFormState = useFormState({
		control: form?.control ?? (EMPTY_FORM_CONTROL as unknown as Control<T>),
	});
	const formState = form ? subscribedFormState : undefined;
	const { isValid, isSubmitting, errors } = formState ?? {};
	const hasAnyDirty = skipDirtyCheck || isFormDirty(formState);
	const disabled = form
		? !isValid || !hasAnyDirty || !!isSubmitting || !!confirmDisabled
		: confirmDisabled || isConfirming;
	const loading = isSubmitting || isConfirming;

	// 저장 버튼이 막힌 이유 전부 — 팝오버가 열렸을 때만 계산한다(폼 전체 재검증이 가볍지 않다)
	const disabledReasons = useMemo(() => {
		if (!form || !reasonsAnchorEl) return [];
		const reasons: string[] = [];
		if (!hasAnyDirty) reasons.push('변경된 내용이 없습니다');
		if (!isValid) {
			// formState.errors 에는 사용자가 건드린 칸의 오류만 있다 — 아직 손대지 않은 칸의 사유까지 보여 주려고 전체를 다시 검증한다
			const parsed = schema?.safeParse(form.getValues());
			const messages =
				parsed && !parsed.success
					? parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
					: Object.entries(errors ?? {}).map(
							([key, error]) => `${key}: ${String(error?.message ?? '')}`,
						);
			reasons.push(...new Set(messages));
		}
		if (confirmDisabled && confirmDisabledReason) reasons.push(confirmDisabledReason);
		if (isSubmitting) reasons.push('제출 중입니다');
		return reasons;
	}, [
		form,
		schema,
		errors,
		hasAnyDirty,
		isValid,
		isSubmitting,
		confirmDisabled,
		confirmDisabledReason,
		reasonsAnchorEl,
	]);

	// 닫기 요청(X 버튼 · 취소 · ESC · 바깥 클릭)이 모두 여기로 온다
	const handleRequestClose = async () => {
		// 제출 중에 닫히면 요청만 계속 진행되는 어색한 상태가 된다
		if (isSubmitting || confirmingRef.current) return;

		// 바꾼 값이 있으면 실수로 닫아 입력을 잃지 않게 한 번 묻는다
		if (isFormDirty(formState)) {
			const confirmed = await confirm({
				variant: 'warning',
				message: '변경사항이 저장되지 않습니다. 닫으시겠습니까?',
			});
			if (!confirmed) return;
			form?.reset();
		}

		onClose();
	};

	// 폼 모달의 제출 — 푸터의 저장 버튼과 입력칸의 Enter 가 모두 이 함수로 들어온다
	const handleFormSubmit: SubmitEventHandler<HTMLFormElement> = e => {
		if (!onConfirm || !form) return;
		// 버튼이 막힌 상태인데 Enter 로 제출되는 것을 막는다 (버튼 disabled 는 Enter 를 막지 못한다)
		if (confirmDisabled) return e.preventDefault();
		if (!hasAnyDirty) return e.preventDefault();

		void form.handleSubmit(async values => {
			if (hasConfirmButton && !skipConfirm) {
				// 확인 버튼 이름을 바꾼 모달(예: '연장 신청')은 확인창의 버튼도 같은 이름으로 맞춘다
				const confirmed = await confirm({
					variant,
					message: confirmMessage,
					labels: confirmLabel ? { confirm: confirmLabel } : undefined,
				});
				if (!confirmed) return;
			}

			try {
				// 사용자가 실제로 바꾼 칸만 골라 함께 넘긴다 — 변경분만 보내고 싶은 화면이 쓸 수 있다
				const dirtyKeys = Object.keys(formState?.dirtyFields ?? {});
				const dirtiedValues = Object.fromEntries(
					Object.entries(values).filter(([key]) => dirtyKeys.includes(key)),
				) as Partial<T>;

				await onConfirm(values, dirtiedValues);

				form.reset();
				onClose();
			} catch {
				// 실패 안내는 QueryProvider 의 MutationCache 가 공용 오류 다이얼로그로 한다 — 여기서는 모달을 닫지 않고 입력값을 유지한다
			}
		})(e);
	};

	// 폼이 없는 모달의 확인 — 끝날 때까지 기다리며 연타를 막는다
	const handleClickConfirm = async () => {
		if (!onConfirm || form || confirmingRef.current) return;

		confirmingRef.current = true;
		setIsConfirming(true);
		try {
			await (onConfirm as () => unknown | Promise<unknown>)();
		} finally {
			confirmingRef.current = false;
			setIsConfirming(false);
		}
	};

	const formModalValue = form ? { formId, onSubmit: handleFormSubmit } : null;

	const renderFooter = () => {
		if (footer) return <footer className='rounded-b-[inherit] bg-gray-50 p-4'>{footer}</footer>;
		if (!enableFooter) return null;

		return (
			<footer className='relative flex justify-end gap-2 rounded-b-[inherit] bg-gray-50 p-4'>
				<Button
					variant='outlined'
					color='inherit'
					disabled={isSubmitting}
					onClick={() => void handleRequestClose()}
				>
					{button.closeLabel}
				</Button>
				{hasConfirmButton && (
					<>
						<Button
							// 폼 모달이면 본문의 <form id={formId}> 를 제출한다 — 버튼이 폼 밖(푸터)에 있어도 form 속성으로 이어진다
							type={form ? 'submit' : 'button'}
							form={form ? formId : undefined}
							variant='contained'
							disableElevation
							color={button.color}
							startIcon={<Icon />}
							disabled={disabled}
							loading={loading}
							onClick={form ? undefined : () => void handleClickConfirm()}
						>
							{confirmLabel ?? button.confirmLabel}
						</Button>
						{form && disabled && (
							<>
								<IconButton
									size='small'
									color='warning'
									aria-label='저장할 수 없는 이유 보기'
									className='absolute top-1.5 right-1.5 bg-white p-0'
									onClick={e => setReasonsAnchorEl(e.currentTarget)}
								>
									<InfoOutlinedIcon fontSize='small' />
								</IconButton>
								<Popover
									anchorEl={reasonsAnchorEl}
									open={!!reasonsAnchorEl}
									onClose={() => setReasonsAnchorEl(null)}
									anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
									transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
								>
									<div className='flex max-w-xs flex-col gap-1 p-3'>
										{disabledReasons.map(reason => (
											<Typography key={reason} variant='body2'>
												{reason}
											</Typography>
										))}
									</div>
								</Popover>
							</>
						)}
					</>
				)}
			</footer>
		);
	};

	return (
		<FormModalProvider value={formModalValue}>
			<MuiModal open={open} onClose={() => void handleRequestClose()}>
				{/* 바깥 section — 화면 가운데에 놓기만 한다. 빈 곳을 누르면 뒤의 backdrop 이 받도록 클릭을 통과시킨다 */}
				<section className='pointer-events-none flex size-full items-center justify-center'>
					{/* 안쪽 section — 실제 모달 상자. 헤더 · 본문 · 푸터 3줄 grid 이고 본문만 스크롤된다 */}
					<section
						className={cn(
							'pointer-events-auto relative grid max-h-[97dvh] grid-cols-1 grid-rows-[auto_1fr_auto] rounded-lg bg-white shadow-2xl',
							SIZE_WIDTHS[size],
						)}
					>
						<header className='flex items-center justify-between gap-4 rounded-t-[inherit] bg-gray-50 p-4'>
							<Typography component='h2' className='text-xl font-bold text-gray-800'>
								{title}
							</Typography>
							<div className='flex items-center gap-2'>
								{actions}
								<IconButton
									size='small'
									aria-label='닫기'
									title='닫기'
									onClick={() => void handleRequestClose()}
								>
									<CloseIcon fontSize='small' />
								</IconButton>
							</div>
						</header>

						<div className='relative overflow-x-hidden overflow-y-auto p-4'>
							{children}
						</div>

						{renderFooter()}
					</section>
				</section>
			</MuiModal>
		</FormModalProvider>
	);
};

export default Modal;
