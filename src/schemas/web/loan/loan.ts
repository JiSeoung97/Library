import { MAX_EXTENSION_REASON_LENGTH } from '@/consts/loan/loan';
import { required } from '@/schemas/common/field';
import { z } from 'zod';

export const schemaFormLoanExtensionRequest = z.object({
	reason: required(z.string()).max(
		MAX_EXTENSION_REASON_LENGTH,
		`연장 사유는 ${MAX_EXTENSION_REASON_LENGTH}자 이하로 입력해주세요.`,
	),
});

export interface ISchemaFormLoanExtensionRequest extends z.infer<
	typeof schemaFormLoanExtensionRequest
> {}

/** 대출 / 반납 현황 화면의 검색 조건 — 빈 값은 조건에서 빠진다 */
export const schemaSearchLoan = z.object({
	memberName: z.string(),
	bookTitle: z.string(),
	// 대출일 기간 — 'YYYY-MM-DD' 문자열, 빈 문자열이면 조건 없음 (DatePickerController 가 문자열로 저장한다)
	loanedFrom: z.string(),
	loanedTo: z.string(),
	// 반납예정일 기간 — 형식은 대출일과 같다
	dueFrom: z.string(),
	dueTo: z.string(),
});

export interface ISchemaSearchLoan extends z.infer<typeof schemaSearchLoan> {}

/**
 * 대출 처리 (관리자) — 회원과 도서를 하나씩 고른다.
 * 고르기 전 값은 0 이다(선택 안 함). 0 은 실제 번호가 아니므로 1 이상이어야 통과한다.
 */
export const schemaCreateLoan = z.object({
	memberId: z.number().int().min(1, '회원을 선택해주세요.'),
	bookId: z.number().int().min(1, '도서를 선택해주세요.'),
});

export interface ISchemaCreateLoan extends z.infer<typeof schemaCreateLoan> {}
