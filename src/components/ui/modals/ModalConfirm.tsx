import { SIZE_WIDTHS, VARIANT_BUTTONS } from '@/components/ui/modals/Modal';
import { cn } from '@/utils/common/cn';
import type { IConfirmOptions } from '@/utils/common/confirm';
import CloseIcon from '@mui/icons-material/Close';
import { Button, IconButton, Modal, Typography } from '@mui/material';
import { useState } from 'react';

interface IProps extends IConfirmOptions {
	open: boolean;
	onConfirm: () => void;
	onClose: () => void;
}

/**
 * 확인 다이얼로그 — "저장하시겠습니까?", "정말 삭제하시겠습니까?" 와 오류 안내를 한 가지 모양으로 띄운다.
 * mes_FE ModalConfirm 과 같은 구조이고, 제목 · 아이콘 · 색 · 버튼 이름은 Modal 의 VARIANT_BUTTONS 표에서 가져온다.
 *
 * 화면이 직접 렌더링하지 않는다 — ConfirmGuardProvider 가 앱에 하나만 띄워 두고,
 * 화면은 `await confirm({ variant, message })` 로 결과(true/false)만 받는다.
 */
const ModalConfirm = ({ open, variant = 'save', message, labels, onConfirm, onClose }: IProps) => {
	const meta = VARIANT_BUTTONS[variant];
	const { Icon } = meta;

	// 확인 버튼을 빠르게 두 번 눌러 onConfirm 이 두 번 불리는 것을 막는다.
	// 다이얼로그는 앱에 하나뿐이라 계속 재사용되므로, 다시 열릴 때마다 상태를 되돌린다(렌더링 중 조정 — effect 로 하면 한 박자 늦는다)
	const [submitting, setSubmitting] = useState(false);
	const [prevOpen, setPrevOpen] = useState(open);
	if (open !== prevOpen) {
		setPrevOpen(open);
		if (open) setSubmitting(false);
	}

	return (
		<Modal open={open} onClose={onClose}>
			<section className='pointer-events-none flex size-full items-center justify-center'>
				<section
					className={cn(
						'pointer-events-auto relative grid max-h-[97dvh] grid-cols-1 grid-rows-[auto_1fr_auto] rounded-lg bg-white shadow-2xl',
						SIZE_WIDTHS.xsmall,
					)}
				>
					<header className='flex items-center justify-between gap-4 rounded-t-[inherit] bg-gray-50 p-4'>
						<Typography component='h2' className='text-xl text-gray-800'>
							{meta.title}
						</Typography>
						<IconButton size='small' aria-label='닫기' onClick={onClose}>
							<CloseIcon fontSize='small' />
						</IconButton>
					</header>

					<article className='overflow-y-auto p-4'>
						<div className='flex flex-col items-center justify-center gap-5'>
							<div
								className={cn('rounded-full p-3 text-white', meta.iconBgClassName)}
							>
								<Icon color='inherit' className='text-6xl' />
							</div>
							{/* whitespace-pre-line — 문구 안의 줄바꿈(\n)을 그대로 보여 준다 */}
							<Typography className='text-center whitespace-pre-line'>
								{message ?? meta.message}
							</Typography>
						</div>
					</article>

					<footer className='flex justify-end gap-2 rounded-b-[inherit] bg-gray-50 p-4'>
						<Button variant='outlined' color='inherit' onClick={onClose}>
							{labels?.close ?? meta.closeLabel}
						</Button>
						{meta.hasConfirm && (
							<Button
								variant='contained'
								disableElevation
								color={meta.color}
								startIcon={<Icon />}
								disabled={submitting}
								onClick={() => {
									setSubmitting(true);
									onConfirm();
								}}
							>
								{labels?.confirm ?? meta.confirmLabel}
							</Button>
						)}
					</footer>
				</section>
			</section>
		</Modal>
	);
};

export default ModalConfirm;
