import dayjs from 'dayjs';

/**
 * 날짜 시각(ISO 문자열) → 이 브라우저 시간대 기준 날짜 'YYYY-MM-DD'.
 *
 * 문자열 앞 10자리를 자르지 않는 이유: 서버가 주는 ISO 문자열은 UTC 기준이라(예: '2026-10-02T23:00:00.000Z'),
 * 한국 시간 자정 ~ 오전 9시의 시각은 앞 10자리가 하루 전 날짜다. dayjs 로 현지 시각으로 바꾼 뒤 날짜를 만든다.
 * 이미 'YYYY-MM-DD' 인 값은 그 날짜 그대로 나온다.
 */
export const toLocalDate = (value: string) => dayjs(value).format('YYYY-MM-DD');

/** 화면 표시용 날짜 — 값이 없으면 '-' */
export const formatDate = (value: string | null | undefined) => (value ? toLocalDate(value) : '-');
