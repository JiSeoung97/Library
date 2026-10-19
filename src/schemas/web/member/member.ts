import {
	LOGIN_ID_MAX_LENGTH,
	PASSWORD_MAX_LENGTH,
	PASSWORD_MIN_LENGTH,
} from '@/consts/common/auth';
import { required } from '@/schemas/common/field';
import { z } from 'zod';

/** 연락처 형식 — 국내 휴대전화 010-0000-0000 (목록 표시 · 검색과 같은 모양으로 저장되게 등록 · 수정에서 맞춘다) */
const PHONE_PATTERN = /^010-\d{4}-\d{4}$/;

// 길이는 로그인과 같은 상수를 쓴다 — 등록할 수 있는 비밀번호는 항상 로그인할 수 있어야 한다
const password = z
	.string()
	.min(PASSWORD_MIN_LENGTH, `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`)
	.max(PASSWORD_MAX_LENGTH, `비밀번호는 ${PASSWORD_MAX_LENGTH}자 이하여야 합니다.`);

export const schemaCreateMember = z.object({
	name: required(z.string()),
	phone: required(z.string()).regex(
		PHONE_PATTERN,
		'연락처는 010-1234-5678 형식으로 입력해주세요.',
	),
	email: z.string().email('올바른 이메일을 입력해주세요.'),
	loginId: required(z.string()).max(
		LOGIN_ID_MAX_LENGTH,
		`아이디는 ${LOGIN_ID_MAX_LENGTH}자 이하여야 합니다.`,
	),
	password,
});

/** 수정 시 비밀번호는 선택 — 비워두면 기존 비밀번호를 그대로 둔다 */
// 아이디는 수정 화면에서 바꿀 수 없어(읽기 전용) 길이 검사를 다시 하지 않는다
export const schemaUpdateMember = schemaCreateMember.extend({
	loginId: z.string(),
	password: z.union([z.literal(''), password]),
});

export interface ISchemaCreateMember extends z.infer<typeof schemaCreateMember> {}
export interface ISchemaUpdateMember extends z.infer<typeof schemaUpdateMember> {}

/** 회원 관리 화면의 항목별 검색 조건 — 빈 값은 조건에서 빠진다 */
export const schemaSearchMember = z.object({
	name: z.string(),
	phone: z.string(),
	status: z.union([z.literal(''), z.enum(['ACTIVE', 'OVERDUE', 'WITHDRAWN'])]),
	email: z.string(),
});

export interface ISchemaSearchMember extends z.infer<typeof schemaSearchMember> {}

/** 내 정보 수정 — 본인이 바꿀 수 있는 항목만 (이름·회원번호·권한은 관리자만 변경) */
export const schemaUpdateMyInfo = schemaCreateMember.pick({ phone: true, email: true });

export interface ISchemaUpdateMyInfo extends z.infer<typeof schemaUpdateMyInfo> {}
