import DatePickerController from '@/components/ui/inputs/dates/DatePickerController';
import TextFieldController from '@/components/ui/inputs/TextFieldController';
import { cn } from '@/utils/common/cn';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import { Button, MenuItem, Typography } from '@mui/material';
import type { ReactNode, SubmitEventHandler } from 'react';
import type { Control, FieldValues, Path } from 'react-hook-form';

// 조밀한 검색 툴바용 입력칸 — 높이 약 1.95rem, 글자 0.75rem.
// select 는 오른쪽 화살표 자리(2rem)를 남기려고 선택자를 한 단계 더 구체적으로 써서 px-2 를 이긴다
const SEARCH_INPUT_CLASS = [
	'[&_.MuiOutlinedInput-root]:rounded-md [&_.MuiOutlinedInput-root]:bg-white [&_.MuiOutlinedInput-root]:text-[0.75rem]',
	'[&_.MuiInputBase-input]:h-6 [&_.MuiInputBase-input]:px-2 [&_.MuiInputBase-input]:py-[0.225rem]',
	'[&_.MuiSelect-select]:min-h-6 [&_.MuiSelect-select]:leading-6 [&_.MuiSelect-select.MuiInputBase-input]:pr-8',
].join(' ');

// 날짜 입력칸 — MUI X DatePicker 는 입력 DOM 이 일반 TextField 와 달라(MuiPickers*) 선택자를 따로 둔다.
// 텍스트 · 셀렉트 검색칸과 같은 높이 · 글자 크기 · 모서리로 맞춘다
const SEARCH_DATE_CLASS = [
	'[&_.MuiPickersOutlinedInput-root]:h-[1.95rem] [&_.MuiPickersOutlinedInput-root]:rounded-md [&_.MuiPickersOutlinedInput-root]:bg-white',
	'[&_.MuiPickersOutlinedInput-root]:pr-1 [&_.MuiPickersOutlinedInput-root]:pl-2 [&_.MuiPickersOutlinedInput-root]:text-[0.75rem]',
	// 날짜 글자 영역은 기본 폭이 고정이라 좁은 칸에서 달력 버튼을 밀어낸다 → 남는 폭만 쓰게 하고 버튼은 줄어들지 않게 한다
	'[&_.MuiPickersSectionList-root]:w-0 [&_.MuiPickersSectionList-root]:min-w-0 [&_.MuiPickersSectionList-root]:flex-1 [&_.MuiPickersSectionList-root]:py-0',
	'[&_.MuiInputAdornment-root]:ml-1 [&_.MuiInputAdornment-root]:shrink-0',
	// 달력 버튼 — MUI 가 오른쪽 끝 버튼에 주는 음수 여백(-12px)을 없애야 테두리 밖으로 나가지 않는다
	'[&_.MuiIconButton-root]:mr-0 [&_.MuiIconButton-root]:p-0.5 [&_.MuiSvgIcon-root]:text-[1rem]',
].join(' ');

interface ISearchFieldProps {
	label: string;
	/** 폭을 바꿀 때만 넘긴다 (기본 w-44) — 기간처럼 입력칸이 둘인 조건은 더 넓게 */
	className?: string;
	children: ReactNode;
}

/** 입력칸 위에 라벨을 두는 검색 조건 한 칸 — 모든 검색 조건이 같은 라벨 크기 · 간격을 쓰게 한다 */
const SearchField = ({ label, className, children }: ISearchFieldProps) => (
	<label className={cn('flex w-44 flex-col gap-1', className)}>
		<Typography variant='caption' className='font-semibold text-gray-600'>
			{label}
		</Typography>
		{children}
	</label>
);

interface ISearchInputProps<T extends FieldValues> {
	label: string;
	name: Path<T>;
	control: Control<T>;
	/** 칸 폭을 바꿀 때만 (기본 w-44) — 조건이 많아 한 줄에 다 들어가지 않는 화면에서 줄인다 */
	className?: string;
}

/** 텍스트 검색 조건 한 칸 */
export const SearchTextField = <T extends FieldValues>({
	label,
	name,
	className,
	control,
}: ISearchInputProps<T>) => (
	<SearchField label={label} className={className}>
		<TextFieldController name={name} control={control} className={SEARCH_INPUT_CLASS} />
	</SearchField>
);

/** 선택 검색 조건 한 칸 — 맨 앞에 '전체'(빈 값 = 조건 없음)가 붙는다 */
export const SearchSelectField = <T extends FieldValues>({
	label,
	name,
	control,
	options,
}: ISearchInputProps<T> & { options: readonly { value: string; label: string }[] }) => (
	<SearchField label={label}>
		<TextFieldController
			name={name}
			control={control}
			select
			className={SEARCH_INPUT_CLASS}
			slotProps={{ select: { displayEmpty: true } }}
		>
			<MenuItem value='' dense>
				전체
			</MenuItem>
			{options.map(option => (
				<MenuItem key={option.value} value={option.value} dense>
					{option.label}
				</MenuItem>
			))}
		</TextFieldController>
	</SearchField>
);

interface ISearchDateRangeProps<T extends FieldValues> {
	label: string;
	/** 시작일 필드 이름 */
	fromName: Path<T>;
	/** 종료일 필드 이름 */
	toName: Path<T>;
	control: Control<T>;
	/** 칸 폭을 바꿀 때만 (기본 w-80) */
	className?: string;
}

/**
 * 기간 검색 조건 한 칸 — 시작일 ~ 종료일.
 * 두 칸은 서로의 값을 제약으로 쓴다(시작일은 종료일 이후를, 종료일은 시작일 이전을 고를 수 없다).
 * 한쪽만 입력해도 된다 — 시작일만 넣으면 "그날 이후", 종료일만 넣으면 "그날 이전".
 */
export const SearchDateRangeField = <T extends FieldValues>({
	label,
	fromName,
	toName,
	className,
	control,
}: ISearchDateRangeProps<T>) => (
	// label 대신 div — label 로 감싸면 달력 아이콘을 눌러도 첫 입력칸으로 포커스가 끌려간다
	<div className={cn('flex w-80 flex-col gap-1', className)}>
		<Typography variant='caption' className='font-semibold text-gray-600'>
			{label}
		</Typography>
		<div className='flex flex-row items-center gap-2'>
			<DatePickerController
				name={fromName}
				control={control}
				range={{ role: 'from', pair: toName }}
				fieldProps={{
					slotProps: { textField: { size: 'small', className: SEARCH_DATE_CLASS } },
				}}
			/>
			<span className='text-xs text-gray-400'>~</span>
			<DatePickerController
				name={toName}
				control={control}
				range={{ role: 'to', pair: fromName }}
				fieldProps={{
					slotProps: { textField: { size: 'small', className: SEARCH_DATE_CLASS } },
				}}
			/>
		</div>
	</div>
);

interface IProps {
	onSubmit: SubmitEventHandler<HTMLFormElement>;
	onReset: () => void;
	/**
	 * 목록을 조회하는 중인지 — 조회 훅의 `isFetching` 을 넘긴다 (`isLoading` 은 첫 조회에만 true 라 검색 · 재조회 중에는 막지 못한다).
	 * true 면 검색 버튼은 로딩 표시와 함께, 초기화 버튼도 함께 막는다(초기화도 다시 조회하는 버튼이라서)
	 */
	isSearching?: boolean;
	/** SearchField 들 */
	children: ReactNode;
}

/**
 * 목록 화면 상단 검색 줄 — 왼쪽에 조건, 오른쪽에 초기화·검색 버튼.
 * 입력 중에는 조회하지 않고 검색 버튼(Enter)으로 한 번에 적용하는 화면들이 같은 모양을 쓰도록 분리했다.
 */
const SearchToolbar = ({ onSubmit, onReset, isSearching = false, children }: IProps) => (
	<form
		// 입력칸에서 Enter 를 눌러도 조회 중이면 제출하지 않는다 — 버튼만 막으면 Enter 로 우회할 수 있다
		onSubmit={e => (isSearching ? e.preventDefault() : onSubmit(e))}
		// 카드 여백은 공통 규칙(px-5 py-4) — 아래 카드와의 간격은 페이지 컨테이너의 gap-4 가 맡는다
		className='flex flex-row items-end justify-between gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4'
	>
		<div className='flex flex-row flex-wrap items-end gap-3'>{children}</div>

		<div className='flex shrink-0 flex-row gap-2'>
			<Button
				variant='outlined'
				color='inherit'
				size='small'
				startIcon={<RefreshIcon fontSize='small' />}
				onClick={onReset}
				disabled={isSearching}
				className='h-8 min-h-0 rounded-md border border-solid border-gray-300 bg-white py-0 text-xs text-gray-700'
			>
				초기화
			</Button>
			<Button
				type='submit'
				variant='contained'
				size='small'
				disableElevation
				startIcon={<SearchIcon fontSize='small' />}
				loading={isSearching}
				loadingPosition='start'
				className='h-8 min-h-0 rounded-md py-0 text-xs'
			>
				검색
			</Button>
		</div>
	</form>
);

export default SearchToolbar;
