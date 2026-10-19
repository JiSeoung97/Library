import type { IResponseBody } from '@/types/common/repository';
import type { AxiosError } from 'axios';

// 서버가 사유(returnMess)를 주지 않았을 때 보여줄 기본 문구
const DEFAULT_MESSAGE = '요청을 처리하지 못했습니다.';

/**
 * 응답 실패 인터셉터 — 오류를 화면에 그대로 보여줄 수 있는 `Error(문구)` 하나로 통일한다.
 *
 * 여기로 들어오는 경우는 세 가지:
 * 1. 서버 무응답(네트워크 끊김 · 서버 다운) — error.response 가 없다. 원본 오류를 그대로 넘긴다.
 * 2. interceptorSuccess 가 reject 한 `success: false` — HTTP 상태는 200 이고 returnMess 가 도메인 사유다.
 * 3. 진짜 HTTP 오류(4xx · 5xx) — 상태 코드를 문구 앞에 붙여 구분한다.
 *
 * 알림(다이얼로그)은 여기서 띄우지 않는다 — 오류 형식만 정리하고, 안내는 QueryProvider 의 MutationCache 가 맡는다.
 */
export const interceptorError = (error: AxiosError<IResponseBody<null>>) => {
	// 1. 응답 자체가 없으면 정리할 문구가 없다
	if (!error.response) return Promise.reject(error);

	const { status, data } = error.response;
	const message = data?.returnMess ?? DEFAULT_MESSAGE;

	// 2. 도메인 실패(HTTP 200)는 서버 문구 그대로, 3. HTTP 오류는 `[404] 문구` 처럼 상태 코드를 붙인다
	return Promise.reject(new Error(status === 200 ? message : `[${status}] ${message}`));
};
