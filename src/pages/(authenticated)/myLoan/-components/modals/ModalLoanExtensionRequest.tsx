import FormModal, { type TFormSection } from '@/components/modals/common/inputs/forms/FormModal';
import BoxInfo from '@/components/ui/containers/BoxInfo';
import BoxInfoGrid from '@/components/ui/containers/BoxInfoGrid';
import Modal, {
	type IModalBaseProps,
	type TModalConfirmHandler,
} from '@/components/ui/modals/Modal';
import { MAX_EXTENSION_COUNT, MAX_EXTENSION_REASON_LENGTH } from '@/consts/loan/loan';
import {
	schemaFormLoanExtensionRequest,
	type ISchemaFormLoanExtensionRequest,
} from '@/schemas/web/loan/loan';
import services from '@/services/services';
import type { ILoan } from '@/types/loan/loan';
import { formatDate } from '@/utils/common/date';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert } from '@mui/material';
import { useForm, useWatch } from 'react-hook-form';

/**
 * 반납기한 연장 신청 모달 (회원) — 사유를 적어 신청하면 관리자 승인을 기다린다.
 *
 * 연장할 수 없는 경우(연체 · 이미 신청함 · 횟수 초과)에는 이유를 안내하고 신청 버튼을 막는다.
 * 같은 규칙을 서버도 검사하지만, 누르기 전에 미리 알려 주려고 화면에서도 확인한다.
 */
const ModalLoanExtensionRequest = ({ open, data: loan, onClose }: IModalBaseProps<ILoan>) => {
	const { loanService } = services;
	const mutation = loanService.usePostExtensionRequest();

	const form = useForm<ISchemaFormLoanExtensionRequest>({
		resolver: zodResolver(schemaFormLoanExtensionRequest),
		mode: 'all',
		defaultValues: { reason: '' },
	});
	// 입력한 글자 수 — 입력칸 아래에 "37 / 100자" 로 보여 준다
	const reasonLength = useWatch({ control: form.control, name: 'reason' }).length;

	// 신청할 수 없는 이유 — 위에서부터 먼저 해당하는 것 하나를 보여 준다
	const blockedReason =
		loan.status === 'OVERDUE'
			? '연체 중인 도서는 연장할 수 없습니다. 먼저 반납해주세요.'
			: loan.status !== 'BORROWED'
				? '대출 중인 도서만 연장 신청할 수 있습니다.'
				: loan.pendingExtensionReason
					? '이미 연장 신청이 접수되어 관리자 승인을 기다리고 있습니다.'
					: loan.extensionCount >= MAX_EXTENSION_COUNT
						? `연장은 최대 ${MAX_EXTENSION_COUNT}회까지만 가능합니다.`
						: null;

	const handleSubmit: TModalConfirmHandler<ISchemaFormLoanExtensionRequest> = async values => {
		await mutation.mutateAsync({ data: { loanId: loan.loanId, reason: values.reason } });
	};

	const fields: TFormSection<ISchemaFormLoanExtensionRequest>[] = [
		{
			title: '대출 정보',
			fields: [
				{
					type: 'custom',
					name: 'loanInfo',
					render: () => (
						<div className='flex flex-col gap-3'>
							<BoxInfoGrid>
								<BoxInfo title='도서명' data={loan.bookTitle} fullWidth />
								<BoxInfo title='대출일' data={formatDate(loan.loanedAt)} />
								<BoxInfo title='반납예정일' data={formatDate(loan.dueAt)} />
								<BoxInfo
									title='연장 횟수'
									data={`${loan.extensionCount} / ${MAX_EXTENSION_COUNT}`}
								/>
							</BoxInfoGrid>
							{blockedReason && <Alert severity='warning'>{blockedReason}</Alert>}
						</div>
					),
				},
			],
		},
		{
			title: '연장 사유',
			fields: [
				{
					type: 'textarea',
					name: 'reason',
					fieldProps: {
						label: '연장 사유',
						required: true,
						disabled: !!blockedReason,
						// 입력 단계에서 100자를 넘지 못하게 막는다 (같은 제한을 스키마와 서버도 검사한다)
						slotProps: { htmlInput: { maxLength: MAX_EXTENSION_REASON_LENGTH } },
						helperText: `${reasonLength} / ${MAX_EXTENSION_REASON_LENGTH}자`,
					},
				},
			],
		},
	];

	return (
		<Modal<ISchemaFormLoanExtensionRequest>
			open={open}
			title='대출 연장 신청'
			size='small'
			variant='save'
			confirmLabel='연장 신청'
			confirmMessage='반납기한 연장을 신청하시겠습니까?'
			formProps={{ form, schema: schemaFormLoanExtensionRequest }}
			onConfirm={handleSubmit}
			confirmDisabled={!!blockedReason}
			confirmDisabledReason={blockedReason ?? undefined}
			onClose={onClose}
		>
			<FormModal<ISchemaFormLoanExtensionRequest>
				className='grid-cols-1'
				form={form}
				fields={fields}
			/>
		</Modal>
	);
};

export default ModalLoanExtensionRequest;
