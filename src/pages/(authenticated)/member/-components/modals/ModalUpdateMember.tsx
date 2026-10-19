import FormModal, { type TFormSection } from '@/components/modals/common/inputs/forms/FormModal';
import Modal, {
	type IModalBaseProps,
	type TModalConfirmHandler,
} from '@/components/ui/modals/Modal';
import { schemaUpdateMember, type ISchemaUpdateMember } from '@/schemas/web/member/member';
import services from '@/services/services';
import type { IMember } from '@/types/member/member';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

// 칸 구성은 회원마다 달라지지 않으므로 컴포넌트 밖에 한 번만 만든다
const FIELDS: TFormSection<ISchemaUpdateMember>[] = [
	{
		title: '계정 정보',
		fields: [
			{
				type: 'text',
				name: 'loginId',
				// 아이디는 바꿀 수 없다 — 보여 주기만 한다
				fieldProps: { label: '로그인 아이디', disabled: true, className: 'col-span-full' },
			},
			{
				type: 'text',
				name: 'password',
				fieldProps: {
					type: 'password',
					label: '비밀번호',
					autoComplete: 'new-password',
					className: 'col-span-full',
					helperText: '변경할 때만 입력하세요.',
				},
			},
		],
	},
	{
		title: '기본 정보',
		fields: [
			{ type: 'text', name: 'name', fieldProps: { label: '이름', required: true } },
			{
				type: 'text',
				name: 'phone',
				fieldProps: { label: '연락처', required: true, placeholder: '010-1234-5678' },
			},
			{
				type: 'text',
				name: 'email',
				fieldProps: { label: '이메일', required: true, className: 'col-span-full' },
			},
		],
	},
];

/**
 * 회원 정보 수정 모달 (관리자) — `data` 로 받은 회원을 폼에 채우고, 바꾼 값만 서버로 보낸다.
 */
const ModalUpdateMember = ({ open, data, onClose }: IModalBaseProps<IMember>) => {
	const { memberService } = services;
	const mutation = memberService.usePutMember();

	const form = useForm<ISchemaUpdateMember>({
		resolver: zodResolver(schemaUpdateMember),
		mode: 'all',
		values: {
			loginId: data.loginId,
			password: '', // 기존 비밀번호는 보여 주지 않는다 — 비워 두면 바뀌지 않는다
			name: data.name,
			phone: data.phone,
			email: data.email,
		},
	});

	// 바꾼 값만 보낸다. 비밀번호 칸을 건드리지 않았으면 dirtiedValues 에 없으므로 서버가 기존 비밀번호를 유지한다
	const handleSubmit: TModalConfirmHandler<ISchemaUpdateMember> = async (
		_values,
		dirtiedValues,
	) => {
		await mutation.mutateAsync({ data: { ...dirtiedValues, memberId: data.memberId } });
	};

	return (
		<Modal<ISchemaUpdateMember>
			open={open}
			title='회원 정보 수정'
			size='small'
			variant='save'
			formProps={{ form, schema: schemaUpdateMember }}
			onConfirm={handleSubmit}
			onClose={onClose}
		>
			<FormModal<ISchemaUpdateMember> className='grid-cols-2' form={form} fields={FIELDS} />
		</Modal>
	);
};

export default ModalUpdateMember;
