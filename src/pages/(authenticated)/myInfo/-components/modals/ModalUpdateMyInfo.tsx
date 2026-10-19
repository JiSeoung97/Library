import FormModal, { type TFormSection } from '@/components/modals/common/inputs/forms/FormModal';
import Modal, {
	type IModalBaseProps,
	type TModalConfirmHandler,
} from '@/components/ui/modals/Modal';
import { schemaUpdateMyInfo, type ISchemaUpdateMyInfo } from '@/schemas/web/member/member';
import services from '@/services/services';
import type { IMember } from '@/types/member/member';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextField } from '@mui/material';
import { useForm } from 'react-hook-form';

/**
 * 내 정보 수정 모달 (회원) — 본인이 바꿀 수 있는 항목(연락처 · 이메일)만 입력받는다.
 * 이름 · 회원번호 · 권한은 관리자만 바꿀 수 있어서 이름은 읽기 전용으로 보여 주기만 한다.
 */
const ModalUpdateMyInfo = ({ open, data, onClose }: IModalBaseProps<IMember>) => {
	const { memberService } = services;
	const mutation = memberService.usePutMember();

	const form = useForm<ISchemaUpdateMyInfo>({
		resolver: zodResolver(schemaUpdateMyInfo),
		mode: 'all',
		values: { phone: data.phone, email: data.email },
	});

	// 바꾼 값만 보낸다 — 어느 회원인지(memberId)는 항상 함께 넣는다
	const handleSubmit: TModalConfirmHandler<ISchemaUpdateMyInfo> = async (
		_values,
		dirtiedValues,
	) => {
		await mutation.mutateAsync({ data: { ...dirtiedValues, memberId: data.memberId } });
	};

	const fields: TFormSection<ISchemaUpdateMyInfo>[] = [
		{
			title: '기본 정보',
			fields: [
				{
					// 이름은 폼(스키마)에 없는 값이라 폼과 연결하지 않고 그냥 보여 준다
					type: 'custom',
					name: 'name',
					render: () => (
						<TextField label='이름' value={data.name} size='small' fullWidth disabled />
					),
				},
				{
					type: 'text',
					name: 'phone',
					fieldProps: { label: '연락처', required: true, placeholder: '010-1234-5678' },
				},
				{ type: 'text', name: 'email', fieldProps: { label: '이메일', required: true } },
			],
		},
	];

	return (
		<Modal<ISchemaUpdateMyInfo>
			open={open}
			title='내 정보 수정'
			size='xsmall'
			variant='save'
			formProps={{ form, schema: schemaUpdateMyInfo }}
			onConfirm={handleSubmit}
			onClose={onClose}
		>
			<FormModal<ISchemaUpdateMyInfo> className='grid-cols-1' form={form} fields={fields} />
		</Modal>
	);
};

export default ModalUpdateMyInfo;
