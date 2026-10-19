import { required } from '@/schemas/common/field';
import { z } from 'zod';

export const schemaCreateBook = z.object({
	isbn: required(z.string()),
	title: required(z.string()),
	author: required(z.string()),
	publisher: required(z.string()),
	category: required(z.string()),
	publishedAt: required(z.string()),
	totalQty: z.number().min(1, '1권 이상 입력해주세요.'),
});

export interface ISchemaCreateBook extends z.infer<typeof schemaCreateBook> {}

/** 도서 검색 화면의 항목별 조건 — 빈 값은 조건에서 빠진다 */
export const schemaSearchBook = z.object({
	title: z.string(),
	author: z.string(),
	category: z.string(),
	publisher: z.string(),
	availability: z.union([z.literal(''), z.enum(['AVAILABLE', 'UNAVAILABLE'])]),
});

export interface ISchemaSearchBook extends z.infer<typeof schemaSearchBook> {}

/** 수정은 등록과 같은 항목·규칙 — 권수 감소 제한 등은 서버가 검사한다 */
export const schemaUpdateBook = schemaCreateBook;

export interface ISchemaUpdateBook extends z.infer<typeof schemaUpdateBook> {}
