import type { TBookAvailability, TBookCopyStatus } from '@/types/book/book';
import type { IStatusOption } from '@/types/common/option';

export const CATEGORIES = ['소설', '인문', '과학', '역사', '자기계발', '예술'];

/** 선택 입력용 — 분류는 코드와 라벨이 같다 */
export const CATEGORY_OPTIONS = CATEGORIES.map(category => ({ value: category, label: category }));

export const BOOK_COPY_STATUS_OPTIONS: IStatusOption<TBookCopyStatus>[] = [
	{ value: 'AVAILABLE', label: '대출가능', color: 'success' },
	{ value: 'ON_LOAN', label: '대출중', color: 'primary' },
	{ value: 'LOST', label: '분실', color: 'warning' },
];

export const AVAILABILITY_OPTIONS: { value: TBookAvailability; label: string }[] = [
	{ value: 'AVAILABLE', label: '대출 가능' },
	{ value: 'UNAVAILABLE', label: '대출 불가' },
];
