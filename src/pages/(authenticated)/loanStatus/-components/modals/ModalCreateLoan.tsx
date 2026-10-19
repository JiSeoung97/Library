import FormModal, { type TFormSection } from '@/components/modals/common/inputs/forms/FormModal';
import Modal, {
	type IModalBaseProps,
	type TModalConfirmHandler,
} from '@/components/ui/modals/Modal';
import { LOAN_PERIOD_DAYS } from '@/consts/loan/loan';
import { schemaCreateLoan, type ISchemaCreateLoan } from '@/schemas/web/loan/loan';
import services from '@/services/services';
import type { IBook } from '@/types/book/book';
import type { IMember } from '@/types/member/member';
import { zodResolver } from '@hookform/resolvers/zod';
import { Autocomplete, TextField, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { Controller, useForm, useWatch } from 'react-hook-form';

const DEFAULT_VALUES: ISchemaCreateLoan = { memberId: 0, bookId: 0 };

/**
 * 대출 처리 모달 (관리자) — 과제 3-3 "회원 선택 → 도서 선택 → 대출 처리".
 * 창구에서 사서가 바로 빌려주는 흐름이라 신청 · 승인 단계 없이 저장하는 순간 대출이 된다.
 *
 * ■ 고르는 방법 — 입력하면서 찾는 선택칸(Autocomplete)
 *   회원은 이름 · 회원번호, 도서는 제목 · 저자로 바로 찾는다. 목록은 처음에 한 번 전부 받아 브라우저에서 거른다.
 *
 * ■ 대출 제한 규칙 (과제 3-3 "재고 0권 또는 연체 중인 회원은 대출 차단")
 *   고른 회원이 연체 중이거나 고른 도서의 재고가 0 이면 대출 버튼을 막고 이유를 보여 준다.
 *   화면 검사는 안내용이고, 같은 규칙(+ 최대 권수 · 탈퇴 회원)을 서버도 다시 검사한다.
 */
const ModalCreateLoan = ({ open, onClose }: Omit<IModalBaseProps, 'data'>) => {
	const { memberService, bookService, loanService } = services;
	const mutation = loanService.usePostLoan();

	// 고를 수 있는 회원 · 도서 전체 (take 를 주지 않으면 전부) — 탈퇴 회원은 고를 이유가 없어 뺀다
	const { data: members } = memberService.useGetMemberList({});
	const { data: books } = bookService.useGetBookList({});
	const memberOptions = (members?.data ?? []).filter(member => member.status !== 'WITHDRAWN');
	const bookOptions = books?.data ?? [];

	const form = useForm<ISchemaCreateLoan>({
		resolver: zodResolver(schemaCreateLoan),
		mode: 'all',
		defaultValues: DEFAULT_VALUES,
	});
	const { control } = form;

	const [memberId, bookId] = useWatch({ control, name: ['memberId', 'bookId'] });
	const member = memberOptions.find(option => option.memberId === memberId) ?? null;
	const book = bookOptions.find(option => option.bookId === bookId) ?? null;

	// 대출 제한 — 걸리면 버튼을 막고 이유를 보여 준다 (서버도 같은 규칙으로 다시 검사한다)
	const blockedReason =
		member && member.overdueCount > 0
			? '연체 중인 회원은 대출할 수 없습니다.'
			: book && book.availableQty <= 0
				? '대출 가능한 재고가 없습니다.'
				: undefined;

	const handleSubmit: TModalConfirmHandler<ISchemaCreateLoan> = async values => {
		await mutation.mutateAsync({ data: values });
	};

	const fields: TFormSection<ISchemaCreateLoan>[] = [
		{
			title: '대출 정보',
			fields: [
				{
					type: 'custom',
					name: 'memberId',
					render: () => (
						<Controller
							name='memberId'
							control={control}
							render={({ field, fieldState }) => (
								<Autocomplete<IMember>
									options={memberOptions}
									value={member}
									onChange={(_, value) => field.onChange(value?.memberId ?? 0)}
									onBlur={field.onBlur}
									getOptionLabel={option =>
										`${option.name} (${option.memberCode})`
									}
									isOptionEqualToValue={(option, value) =>
										option.memberId === value.memberId
									}
									renderOption={({ key, ...props }, option) => (
										<li key={key} {...props}>
											<div className='flex w-full flex-row justify-between gap-2'>
												<span>
													{option.name}{' '}
													<span className='text-gray-400'>
														{option.memberCode}
													</span>
												</span>
												{option.overdueCount > 0 && (
													<span className='text-xs font-semibold text-red-600'>
														연체 {option.overdueCount}건
													</span>
												)}
											</div>
										</li>
									)}
									noOptionsText='일치하는 회원이 없습니다'
									renderInput={params => (
										<TextField
											{...params}
											label='회원'
											placeholder='이름 또는 회원번호로 검색'
											size='small'
											required
											error={!!fieldState.error}
											helperText={fieldState.error?.message ?? ' '}
										/>
									)}
								/>
							)}
						/>
					),
				},
				{
					type: 'custom',
					name: 'bookId',
					render: () => (
						<Controller
							name='bookId'
							control={control}
							render={({ field, fieldState }) => (
								<Autocomplete<IBook>
									options={bookOptions}
									value={book}
									onChange={(_, value) => field.onChange(value?.bookId ?? 0)}
									onBlur={field.onBlur}
									getOptionLabel={option => option.title}
									// 제목뿐 아니라 저자로도 찾을 수 있게 검색 대상 문자열을 직접 정한다
									filterOptions={(options, { inputValue }) => {
										const keyword = inputValue.trim().toLowerCase();
										return options.filter(option =>
											`${option.title} ${option.author}`
												.toLowerCase()
												.includes(keyword),
										);
									}}
									isOptionEqualToValue={(option, value) =>
										option.bookId === value.bookId
									}
									renderOption={({ key, ...props }, option) => (
										<li key={key} {...props}>
											<div className='flex w-full flex-row justify-between gap-2'>
												<span>
													{option.title}{' '}
													<span className='text-gray-400'>
														{option.author}
													</span>
												</span>
												<span
													className={
														option.availableQty > 0
															? 'shrink-0 text-xs text-green-700'
															: 'shrink-0 text-xs font-semibold text-red-600'
													}
												>
													{option.availableQty > 0
														? `대출 가능 ${option.availableQty}/${option.totalQty}`
														: '재고 없음'}
												</span>
											</div>
										</li>
									)}
									noOptionsText='일치하는 도서가 없습니다'
									renderInput={params => (
										<TextField
											{...params}
											label='도서'
											placeholder='도서명 또는 저자로 검색'
											size='small'
											required
											error={!!fieldState.error}
											helperText={fieldState.error?.message ?? ' '}
										/>
									)}
								/>
							)}
						/>
					),
				},
				{
					type: 'custom',
					name: 'dueAt',
					render: () => (
						<Typography className='text-sm text-gray-600'>
							반납 예정일{' '}
							<span className='font-semibold text-gray-900'>
								{dayjs().add(LOAN_PERIOD_DAYS, 'day').format('YYYY-MM-DD')}
							</span>{' '}
							(대출일로부터 {LOAN_PERIOD_DAYS}일)
						</Typography>
					),
				},
			],
		},
	];

	return (
		<Modal<ISchemaCreateLoan>
			open={open}
			title='도서 대출'
			size='small'
			variant='save'
			formProps={{ form, schema: schemaCreateLoan }}
			onConfirm={handleSubmit}
			confirmLabel='대출'
			confirmMessage={
				member && book
					? `${member.name} 님에게 '${book.title}'을(를) 대출하시겠습니까?`
					: undefined
			}
			confirmDisabled={!!blockedReason}
			confirmDisabledReason={blockedReason}
			onClose={onClose}
		>
			<FormModal<ISchemaCreateLoan> form={form} fields={fields} />
			{blockedReason && (
				<Typography className='mt-3 text-sm font-semibold text-red-600'>
					{blockedReason}
				</Typography>
			)}
		</Modal>
	);
};

export default ModalCreateLoan;
