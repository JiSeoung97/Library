import TextFieldController from '@/components/ui/inputs/TextFieldController';
import { LOGIN_ID_MAX_LENGTH, PASSWORD_MAX_LENGTH } from '@/consts/common/auth';
import { schemaFormLogin, type ISchemaFormLogin } from '@/schemas/web/auth/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Typography } from '@mui/material';
import { Link } from '@tanstack/react-router';
import type { ElementType } from 'react';
import { useForm } from 'react-hook-form';

interface IProps {
	/** 카드 맨 위 아이콘 */
	Icon: ElementType;
	title: string;
	description: string;
	submitLabel: string;
	/** 데모용 계정 안내 문구 */
	demoAccount: string;
	/** 로그인 요청 중 — 버튼에 로딩 표시 */
	isPending: boolean;
	/** 검증을 통과한 아이디 · 비밀번호로 로그인 요청을 보낸다 (어느 로그인 API 인지는 화면이 정한다) */
	onSubmit: (values: ISchemaFormLogin) => void;
	/** 다른 진입점으로 가는 링크 (데모 편의용) */
	switchLink: { to: '/login' | '/admin/login'; label: string };
}

/**
 * 로그인 카드 — 회원 로그인(/login)과 관리자 로그인(/admin/login)이 함께 쓰는 화면 틀.
 * 진입점은 둘로 나눴지만 입력 칸(아이디 · 비밀번호)과 검증은 같으므로 모양은 한곳에서 그린다.
 * 어느 API 로 보낼지(역할)만 각 화면이 정한다.
 */
const LoginCard = ({
	Icon,
	title,
	description,
	submitLabel,
	demoAccount,
	isPending,
	onSubmit,
	switchLink,
}: IProps) => {
	const { control, handleSubmit } = useForm<ISchemaFormLogin>({
		resolver: zodResolver(schemaFormLogin),
		defaultValues: { loginId: '', password: '' },
	});

	return (
		<div className='flex h-screen items-center justify-center bg-linear-to-br from-blue-50 via-white to-indigo-100'>
			<section className='w-98.5 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl'>
				<header className='flex flex-col items-center gap-3 px-8 pt-8 pb-2'>
					<div className='flex size-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md'>
						<Icon />
					</div>
					<div className='text-center'>
						<Typography component='h1' className='text-xl font-bold text-gray-900'>
							{title}
						</Typography>
						<Typography className='mt-1 text-sm text-gray-500'>
							{description}
						</Typography>
					</div>
				</header>

				<form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4 px-8 py-6'>
					<div className='flex flex-col gap-1'>
						<TextFieldController
							name='loginId'
							control={control}
							label='아이디'
							helperText=' '
							slotProps={{ htmlInput: { maxLength: LOGIN_ID_MAX_LENGTH } }}
						/>
						<TextFieldController
							name='password'
							control={control}
							type='password'
							label='비밀번호'
							helperText=' '
							slotProps={{ htmlInput: { maxLength: PASSWORD_MAX_LENGTH } }}
						/>
					</div>

					<Button
						type='submit'
						variant='contained'
						size='large'
						disableElevation
						loading={isPending}
						className='mt-1 rounded-lg'
					>
						{submitLabel}
					</Button>

					<Typography className='rounded-lg bg-gray-50 py-2 text-center text-xs text-gray-500'>
						{demoAccount}
					</Typography>
				</form>

				<footer className='border-t border-gray-100 py-3 text-center'>
					<Link
						to={switchLink.to}
						className='text-xs text-gray-500 hover:text-blue-700 hover:underline'
					>
						{switchLink.label}
					</Link>
				</footer>
			</section>
		</div>
	);
};

export default LoginCard;
