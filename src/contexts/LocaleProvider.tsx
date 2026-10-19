import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { koKR } from '@mui/x-date-pickers/locales';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import type { ReactNode } from 'react';

// 날짜 필터(filterVariant: 'date-range')가 내부적으로 DatePicker 를 쓰므로 이 Provider 가 없으면 크래시한다
dayjs.locale('ko');

interface IProps {
	children: ReactNode;
}

const LocaleProvider = ({ children }: IProps) => (
	<LocalizationProvider
		dateAdapter={AdapterDayjs}
		adapterLocale='ko'
		localeText={koKR.components.MuiLocalizationProvider.defaultProps.localeText}
	>
		{children}
	</LocalizationProvider>
);

export default LocaleProvider;
