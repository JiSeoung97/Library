import type { TFormSection } from '@/components/modals/common/inputs/forms/FormModal';
import { CATEGORY_OPTIONS } from '@/consts/book/book';
import type { ISchemaCreateBook } from '@/schemas/web/book/book';

/**
 * 도서 등록 · 수정 모달이 함께 쓰는 폼 구성 — 두 모달의 칸이 같아서 한곳에 둔다.
 * 어떤 칸을 어떤 순서로 둘지만 적고, 실제 입력 컴포넌트는 FormModal 이 종류(type)에 맞게 그린다.
 */
export const BOOK_FORM_FIELDS: TFormSection<ISchemaCreateBook>[] = [
	{
		title: '기본 정보',
		fields: [
			{ type: 'text', name: 'title', fieldProps: { label: '도서명', required: true } },
			{ type: 'text', name: 'author', fieldProps: { label: '저자', required: true } },
			{
				type: 'select',
				name: 'category',
				options: CATEGORY_OPTIONS,
				fieldProps: { label: '분류', required: true },
			},
			{ type: 'text', name: 'publisher', fieldProps: { label: '출판사', required: true } },
		],
	},
	{
		title: '출판 · 보유 정보',
		fields: [
			// ISBN — 책마다 붙는 국제 표준 도서 번호 (뒤표지 바코드 위의 번호)
			{ type: 'text', name: 'isbn', fieldProps: { label: 'ISBN', required: true } },
			{
				type: 'date',
				name: 'publishedAt',
				fieldProps: {
					label: '출간일',
					disableFuture: true, // 아직 오지 않은 날짜는 출간일이 될 수 없다
					slotProps: { textField: { required: true } },
				},
			},
			{
				type: 'text',
				name: 'totalQty',
				// type='number' 면 TextFieldController 가 입력값을 숫자로 바꿔 폼에 넣는다 (스키마가 z.number())
				fieldProps: { type: 'number', label: '총 보유 권수', required: true },
			},
		],
	},
];
