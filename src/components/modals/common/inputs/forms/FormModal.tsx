import type { TDatePickerProps } from '@/components/ui/inputs/dates/DatePicker';
import DatePickerController from '@/components/ui/inputs/dates/DatePickerController';
import TextFieldController from '@/components/ui/inputs/TextFieldController';
import ModalSubTitle from '@/components/ui/modals/ModalSubTitle';
import { useFormModal } from '@/contexts/FormModalProvider';
import { cn } from '@/utils/common/cn';
import { MenuItem, type TextFieldProps } from '@mui/material';
import { Fragment, type ReactNode } from 'react';
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';

/**
 * 모달 폼 입력칸의 공통 모양 — mes_FE webTheme 의 MuiInputLabel · MuiOutlinedInput 설정을 이 폼 안에만 적용한다.
 * (mes_FE 는 MUI 테마로 앱 전체에 주지만, 이 프로젝트는 테마 없이 공통 부품에 Tailwind 로 스타일을 준다는 원칙이라
 *  모달 폼 한 곳에만 둔다 — 검색 툴바 · 로그인 화면의 입력칸은 영향을 받지 않는다)
 *
 * 1. 라벨을 입력칸 "위"에 따로 둔다
 *    MUI 기본은 라벨이 입력칸 안에 있다가 테두리 위로 떠오르는(floating) 방식이다.
 *    → position: static · transform: none 으로 일반 글자처럼 입력칸 위에 놓고,
 *      테두리에 라벨 자리를 파 두는 홈(legend)은 숨긴다. 필수 표시(*)는 빨간색.
 * 2. 입력칸을 낮게 — 모든 칸을 size='small' 로 그리고(아래 renderField) 글자를 text-sm 으로 줄인다.
 * 3. 포커스 — 테두리를 굵게 하지 않고 옅은 파란 그림자로 표시한다.
 * DatePicker 는 입력 DOM 이 달라(MuiPickers*) 같은 규칙을 따로 한 번 더 적는다.
 */
const FORM_FIELD_CLASS = [
	// 라벨 — 입력칸 위에 따로
	'[&_.MuiInputLabel-root]:static [&_.MuiInputLabel-root]:mb-1 [&_.MuiInputLabel-root]:transform-none',
	'[&_.MuiInputLabel-root]:text-[0.8rem] [&_.MuiInputLabel-root]:font-semibold [&_.MuiInputLabel-root]:text-gray-700',
	'[&_.MuiInputLabel-root.Mui-focused]:text-gray-700 [&_.MuiInputLabel-root.Mui-disabled]:text-gray-500',
	'[&_.MuiFormLabel-asterisk]:text-red-600',
	// 테두리의 라벨 홈 없애기 — 라벨이 밖에 있으므로 테두리를 끊지 않는다
	'[&_.MuiOutlinedInput-notchedOutline]:top-0 [&_.MuiOutlinedInput-notchedOutline_legend]:hidden',
	'[&_.MuiPickersOutlinedInput-notchedOutline]:top-0 [&_.MuiPickersOutlinedInput-notchedOutline_legend]:hidden',
	// 입력칸 — 모서리 · 글자 크기
	'[&_.MuiOutlinedInput-root]:rounded-lg [&_.MuiOutlinedInput-root]:text-sm',
	'[&_.MuiPickersOutlinedInput-root]:rounded-lg [&_.MuiPickersOutlinedInput-root]:text-sm',
	// 포커스 — 옅은 파란 그림자
	'[&_.MuiOutlinedInput-root.Mui-focused]:shadow-[0_0_0_3px_rgb(37_99_235/0.12)]',
	'[&_.MuiPickersOutlinedInput-root.Mui-focused]:shadow-[0_0_0_3px_rgb(37_99_235/0.12)]',
	'[&_.Mui-focused_.MuiOutlinedInput-notchedOutline]:border [&_.Mui-focused_.MuiPickersOutlinedInput-notchedOutline]:border',
].join(' ');

/** 입력칸에 넘길 수 있는 옵션 — name 과 폼 연결(value · onChange)은 FormModal 이 맡는다 */
type TFieldProps = Omit<TextFieldProps, 'name' | 'value' | 'onChange'>;

/**
 * 폼의 칸 하나 — 화면은 "어떤 종류의 칸인지"만 적고, 실제 입력 컴포넌트는 FormModal 이 고른다.
 * (mes_FE TFormField 에서 이 프로젝트에 필요한 종류만 가져왔다)
 */
export type TFormField<T extends FieldValues> =
	| { type: 'text'; name: Path<T>; fieldProps?: TFieldProps }
	| {
			type: 'select';
			name: Path<T>;
			/** 고를 수 있는 값 목록 */
			options: readonly { value: string; label: string }[];
			fieldProps?: TFieldProps;
	  }
	| {
			type: 'date';
			name: Path<T>;
			/** 기간의 한쪽이면 짝 필드를 알려 준다 — 시작일 · 종료일이 서로를 넘지 못한다 */
			range?: { role: 'from' | 'to'; pair: Path<T> };
			fieldProps?: Omit<TDatePickerProps, 'value' | 'onChange'>;
	  }
	/** 여러 줄 입력 — 항상 한 줄 전체 폭을 쓴다 */
	| { type: 'textarea'; name: Path<T>; fieldProps?: TFieldProps }
	/** 위 종류로 표현할 수 없는 칸 (예: 입력칸 + 중복 확인 버튼). 기본은 한 줄 전체 폭 */
	| { type: 'custom'; name: string; title?: string; className?: string; render: () => ReactNode };

/** 폼의 구획 — 제목(예: '기본정보') 아래에 칸들이 놓인다. 제목이 빈 문자열이면 제목 줄 없이 칸만 그린다 */
export type TFormSection<T extends FieldValues> = {
	title: string;
	fields: TFormField<T>[];
};

interface IProps<T extends FieldValues> {
	form: UseFormReturn<T>;
	fields: TFormSection<T>[];
	/** 몇 칸짜리 grid 인지 (예: 'grid-cols-2') */
	className?: string;
}

/**
 * 모달 안의 폼 — 구획 · 칸 목록(fields)을 받아 같은 모양의 폼을 그린다. mes_FE FormModal 을 축소 이식했다.
 *
 * 화면마다 <TextField> 를 직접 나열하지 않고 목록으로 넘기는 이유:
 * 칸 사이 간격 · 구획 제목 · 입력칸 종류별 모양이 모든 모달에서 같아진다.
 *
 * 제출은 직접 처리하지 않는다 — 바깥 Modal 이 Context 로 내려 준 formId · onSubmit 을 <form> 에 연결만 한다.
 */
const FormModal = <T extends FieldValues>({ form, fields, className }: IProps<T>) => {
	const formModal = useFormModal();

	const renderField = (field: TFormField<T>): ReactNode => {
		switch (field.type) {
			case 'text':
				return (
					<TextFieldController<T>
						name={field.name}
						control={form.control}
						size='small'
						{...field.fieldProps}
					/>
				);
			case 'select':
				return (
					<TextFieldController<T>
						name={field.name}
						control={form.control}
						select
						size='small'
						{...field.fieldProps}
					>
						{field.options.map(option => (
							<MenuItem key={option.value} value={option.value}>
								{option.label}
							</MenuItem>
						))}
					</TextFieldController>
				);
			case 'date':
				return (
					<DatePickerController<T>
						name={field.name}
						control={form.control}
						range={field.range}
						fieldProps={{
							...field.fieldProps,
							slotProps: {
								...field.fieldProps?.slotProps,
								textField: {
									size: 'small',
									...(typeof field.fieldProps?.slotProps?.textField === 'object'
										? field.fieldProps.slotProps.textField
										: {}),
								},
							},
						}}
					/>
				);
			case 'textarea':
				return (
					<div className='col-span-full'>
						<TextFieldController<T>
							name={field.name}
							control={form.control}
							multiline
							minRows={3}
							size='small'
							{...field.fieldProps}
						/>
					</div>
				);
			case 'custom':
				return (
					<div className={cn(field.className ?? 'col-span-full')}>
						{field.title && <ModalSubTitle label={field.title} className='mb-2' />}
						{field.render()}
					</div>
				);
		}
	};

	return (
		<form
			id={formModal?.formId}
			noValidate // 브라우저 기본 검증 말풍선 대신 Zod 검증 메시지를 입력칸 아래에 보여 준다
			className={cn('grid gap-3', FORM_FIELD_CLASS, className)}
			onSubmit={formModal?.onSubmit}
		>
			{/* 숨은 제출 버튼 — 입력칸에서 Enter 를 누르면 브라우저가 폼의 기본 버튼을 찾아 제출한다.
			    실제 저장 버튼은 폼 밖(모달 푸터)에 있으므로, 칸 수와 상관없이 Enter 가 동작하도록 여기에 하나 둔다 */}
			{formModal && <button type='submit' aria-hidden tabIndex={-1} className='hidden' />}

			{fields.map((section, index) => (
				// 구획 하나 = 테두리 있는 카드. subgrid 로 바깥 grid 의 칸 수를 그대로 물려받는다
				<section
					key={`section-${index}`}
					className='col-span-full grid min-h-0 grid-cols-subgrid overflow-hidden rounded-lg border border-gray-200'
				>
					{section.title && (
						<ModalSubTitle label={section.title} className='col-span-full' />
					)}
					<div className='col-span-full grid min-h-0 grid-cols-subgrid gap-3 p-3'>
						{section.fields.map(field => (
							<Fragment key={field.name}>{renderField(field)}</Fragment>
						))}
					</div>
				</section>
			))}
		</form>
	);
};

export default FormModal;
