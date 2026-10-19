import FormModal, { type TFormSection } from '@/components/modals/common/inputs/forms/FormModal';
import Modal, {
	type IModalBaseProps,
	type TModalConfirmHandler,
} from '@/components/ui/modals/Modal';
import { schemaCreateMember, type ISchemaCreateMember } from '@/schemas/web/member/member';
import services from '@/services/services';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, TextField } from '@mui/material';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';

const DEFAULT_VALUES: ISchemaCreateMember = {
	loginId: '',
	password: '',
	name: '',
	phone: '',
	email: '',
};

/**
 * 회원 등록 모달 — 아이디 중복 확인을 통과해야 저장할 수 있다.
 *
 * 저장 버튼은 두 조건이 모두 맞아야 켜진다:
 * 1. 폼 검증 통과 + 입력한 값이 있음 — 공통 Modal 이 판단한다
 * 2. 아이디 중복 확인 통과 — 이 화면만의 조건이라 `confirmDisabled` 로 Modal 에 알려 준다
 */
const ModalCreateMember = ({ open, onClose }: Omit<IModalBaseProps, 'data'>) => {
	const { memberService } = services;
	const mutation = memberService.usePostMember();
	const { mutate: checkLoginId, isPending: isChecking } =
		memberService.useGetLoginIdAvailability();

	const form = useForm<ISchemaCreateMember>({
		resolver: zodResolver(schemaCreateMember),
		mode: 'all',
		defaultValues: DEFAULT_VALUES,
	});
	const { control, setError, clearErrors } = form;

	// 중복 확인을 통과한 아이디를 기억한다 — 확인 뒤에 아이디를 고치면 지금 입력값과 달라져 자동으로 무효가 된다
	const [checkedLoginId, setCheckedLoginId] = useState<string | null>(null);
	const loginId = useWatch({ control, name: 'loginId' });
	const isLoginIdChecked = !!checkedLoginId && checkedLoginId === loginId;

	const handleCheckLoginId = () => {
		if (!loginId) {
			setError('loginId', { message: '아이디를 입력해주세요.' });
			return;
		}

		checkLoginId(
			{ data: { loginId } },
			{
				onSuccess: res => {
					if (res.data.available) {
						setCheckedLoginId(loginId);
						clearErrors('loginId');
						return;
					}

					setCheckedLoginId(null);
					setError('loginId', {
						message: '아이디가 중복되었습니다. 다른 아이디를 입력해주세요.',
					});
				},
			},
		);
	};

	// 회원 테이블에 등록한다 — 관리자 계정은 별도 테이블이라 이 화면에서 만들 수 없다
	const handleSubmit: TModalConfirmHandler<ISchemaCreateMember> = async values => {
		await mutation.mutateAsync({ data: values });
	};

	// 닫힐 때(저장 성공 · 취소 모두) 중복 확인 결과도 함께 지운다 — 폼 값은 Modal 이 초기화한다
	const handleClose = () => {
		setCheckedLoginId(null);
		onClose();
	};

	const fields: TFormSection<ISchemaCreateMember>[] = [
		{
			title: '계정 정보',
			fields: [
				{
					// 입력칸 + 중복 확인 버튼 — 공통 칸 종류로 표현할 수 없어 custom 으로 직접 그린다
					type: 'custom',
					name: 'loginId',
					render: () => (
						<Controller
							name='loginId'
							control={control}
							render={({ field, fieldState }) => (
								<div className='flex flex-row items-start gap-2'>
									<TextField
										{...field}
										label='로그인 아이디'
										size='small'
										fullWidth
										required
										error={!!fieldState.error}
										helperText={
											fieldState.error?.message ??
											(isLoginIdChecked
												? '사용할 수 있는 아이디입니다.'
												: ' ')
										}
										slotProps={{
											formHelperText: isLoginIdChecked
												? { className: 'text-green-700' }
												: undefined,
										}}
									/>
									<Button
										variant='outlined'
										onClick={handleCheckLoginId}
										loading={isChecking}
										// 라벨이 입력칸 위에 따로 있으므로, 버튼을 라벨 높이만큼 내려 입력칸과 같은 줄에 맞춘다
										className='mt-[22px] h-[37px] shrink-0'
									>
										중복 확인
									</Button>
								</div>
							)}
						/>
					),
				},
				{
					type: 'text',
					name: 'password',
					fieldProps: {
						type: 'password',
						label: '비밀번호',
						autoComplete: 'new-password', // 브라우저가 저장된 관리자 비밀번호를 채워 넣지 않게 한다
						className: 'col-span-full',
						required: true,
						helperText: '8자 이상',
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

	return (
		<Modal<ISchemaCreateMember>
			open={open}
			title='회원 등록'
			size='small'
			variant='save'
			formProps={{ form, schema: schemaCreateMember }}
			onConfirm={handleSubmit}
			confirmDisabled={!isLoginIdChecked}
			confirmDisabledReason='아이디 중복 확인을 해주세요'
			onClose={handleClose}
		>
			<FormModal<ISchemaCreateMember> className='grid-cols-2' form={form} fields={fields} />
		</Modal>
	);
};

export default ModalCreateMember;
