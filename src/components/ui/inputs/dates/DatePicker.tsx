import { DatePicker as MuiDatePicker, type DatePickerProps } from '@mui/x-date-pickers/DatePicker';

export type TDatePickerProps = DatePickerProps;

/**
 * MUI DatePicker 를 그대로 감싼 얇은 래퍼 (mes_FE 와 같은 구조).
 * 화면이 MUI 를 직접 import 하지 않고 이 컴포넌트를 거치게 해, 나중에 공통 기본값을 한곳에서 바꿀 수 있게 한다.
 * 한국어 달력 · dayjs 어댑터는 contexts/LocaleProvider 가 앱 전체에 제공한다.
 */
const DatePicker = (props: TDatePickerProps) => <MuiDatePicker {...props} />;

export default DatePicker;
