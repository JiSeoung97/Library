import DatePicker, { type TDatePickerProps } from '@/components/ui/inputs/dates/DatePicker';
import dayjs from 'dayjs';
import { Controller, useWatch, type Control, type FieldValues, type Path } from 'react-hook-form';

/** 폼에 저장하고 서버로 보내는 날짜 형식 */
export const DATE_FORMAT = 'YYYY-MM-DD';

interface IProps<T extends FieldValues> {
	name: Path<T>;
	control: Control<T>;
	/**
	 * 기간(시작일~종료일) 입력일 때 짝 필드를 알려 준다.
	 * - role 'from': 시작일 칸 — 종료일보다 뒤 날짜를 고를 수 없다
	 * - role 'to'  : 종료일 칸 — 시작일보다 앞 날짜를 고를 수 없다
	 */
	range?: { role: 'from' | 'to'; pair: Path<T> };
	/** DatePicker 에 그대로 넘길 나머지 옵션 (value · onChange 는 이 컴포넌트가 폼과 연결한다) */
	fieldProps?: Omit<TDatePickerProps, 'value' | 'onChange'>;
}

/**
 * react-hook-form 필드에 묶인 DatePicker — mes_FE DatePickerController 를 축소 이식했다.
 *
 * mes_FE 와 다른 점: 폼 값으로 Dayjs 객체가 아니라 'YYYY-MM-DD' 문자열을 저장한다('' = 선택 안 함).
 * mes_FE 는 요청 인터셉터(interceptorTransform)가 Dayjs 를 문자열로 바꿔 주지만 이 프로젝트에는 그 인터셉터가 없다.
 * 문자열로 두면 검색 조건을 그대로 서버에 보낼 수 있고, "직전 조건과 같은가" 비교도 단순해진다.
 */
const DatePickerController = <T extends FieldValues>({
	name,
	control,
	range,
	fieldProps,
}: IProps<T>) => {
	// 짝 필드 값을 구독해야 짝 날짜가 바뀔 때 고를 수 있는 범위(min · max)가 바로 갱신된다
	const pairValue = useWatch({ control, name: range?.pair ?? name, disabled: !range }) as
		string | undefined;
	const pairDate = range && pairValue ? dayjs(pairValue) : undefined;

	return (
		<Controller
			name={name}
			control={control}
			render={({ field, fieldState }) => (
				<DatePicker
					format={DATE_FORMAT}
					{...fieldProps}
					// 시작일 칸이면 종료일이 상한, 종료일 칸이면 시작일이 하한
					maxDate={range?.role === 'from' ? pairDate : fieldProps?.maxDate}
					minDate={range?.role === 'to' ? pairDate : fieldProps?.minDate}
					// 폼에는 문자열이 들어 있으므로 달력에 줄 때만 Dayjs 로 바꾼다
					value={field.value ? dayjs(field.value as string) : null}
					// 달력에서 고른 Dayjs → 문자열. 지우거나 입력 중인(완성되지 않은) 날짜는 '' 로 저장한다
					onChange={value =>
						field.onChange(value?.isValid() ? value.format(DATE_FORMAT) : '')
					}
					slotProps={{
						...fieldProps?.slotProps,
						// 입력칸 안의 X 버튼으로 날짜를 지울 수 있게 한다
						field: { clearable: true, ...fieldProps?.slotProps?.field },
						textField: {
							fullWidth: true,
							onBlur: field.onBlur,
							error: !!fieldState.error,
							helperText: fieldState.error?.message,
							...(typeof fieldProps?.slotProps?.textField === 'object'
								? fieldProps.slotProps.textField
								: {}),
						},
					}}
				/>
			)}
		/>
	);
};

export default DatePickerController;
