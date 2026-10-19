import type { TRole } from '@/types/common/repository';

/** 로그인 직후·권한 없는 화면 접근 시 보낼 역할별 첫 화면 */
export const HOME_PATH_BY_ROLE = {
	ADMIN: '/dashboard',
	MEMBER: '/bookSearch',
} as const satisfies Record<TRole, string>;

/**
 * 역할별 로그인 화면 — 관리자와 회원은 진입점이 다르다.
 * 로그아웃할 때 "방금까지 쓰던 역할"의 로그인 화면으로 돌려보낸다.
 * 로그인하지 않고 보호된 화면에 들어오면 역할을 알 수 없으므로 회원 로그인(/login)으로 보낸다 — 이용자가 쓰는 기본 진입점이다.
 */
export const LOGIN_PATH_BY_ROLE = {
	ADMIN: '/admin/login',
	MEMBER: '/login',
} as const satisfies Record<TRole, string>;

/*
 * 계정 입력 길이 제한 — 회원 등록 · 로그인 폼 · 로그인 API 가 모두 이 값을 쓴다.
 *
 * 최대 길이를 두는 이유 (보안):
 * 비밀번호 해시(bcrypt · PBKDF2 등)는 무차별 대입을 막으려고 일부러 느리게 만든 계산이라 입력이 길수록 오래 걸린다.
 * 길이 제한이 없으면 아주 긴 비밀번호(수 MB)를 담은 로그인 요청 몇 개로 서버 CPU 를 묶어 둘 수 있다
 * — 실제 사례: Django CVE-2013-1443 (긴 비밀번호로 인한 서비스 거부, 이후 4096 바이트 제한 도입).
 * 화면 제한은 사용자 안내용이고, 브라우저를 거치지 않는 요청도 있으므로 서버(로그인 API)도 같은 값으로 거른다.
 */
/** 로그인 아이디 최대 길이 */
export const LOGIN_ID_MAX_LENGTH = 30;
/** 비밀번호 최소 길이 — 회원 등록 · 변경 때만 검사한다(로그인 때 검사하면 정책만 노출된다) */
export const PASSWORD_MIN_LENGTH = 8;
/** 비밀번호 최대 길이 */
export const PASSWORD_MAX_LENGTH = 32;
