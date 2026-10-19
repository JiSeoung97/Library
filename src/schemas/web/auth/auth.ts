import { LOGIN_ID_MAX_LENGTH, PASSWORD_MAX_LENGTH } from '@/consts/common/auth';
import { required } from '@/schemas/common/field';
import { z } from 'zod';

/**
 * 로그인 폼 — 비어 있지 않은지와 최대 길이만 본다.
 * 최소 길이(비밀번호 8자 이상 등)는 검사하지 않는다: 로그인은 "맞는지"만 서버가 판단하면 되고,
 * 여기서 정책을 검사하면 어떤 비밀번호가 불가능한지 공격자에게 알려 주는 셈이다.
 * 최대 길이는 긴 입력으로 서버 해시 계산을 묶어 두는 공격을 막는 첫 단계다 (consts/common/auth.ts 참고).
 */
export const schemaFormLogin = z.object({
	loginId: required(z.string(), '아이디를 입력해주세요.').max(
		LOGIN_ID_MAX_LENGTH,
		`아이디는 ${LOGIN_ID_MAX_LENGTH}자 이하입니다.`,
	),
	password: required(z.string(), '비밀번호를 입력해주세요.').max(
		PASSWORD_MAX_LENGTH,
		`비밀번호는 ${PASSWORD_MAX_LENGTH}자 이하입니다.`,
	),
});

export interface ISchemaFormLogin extends z.infer<typeof schemaFormLogin> {}
