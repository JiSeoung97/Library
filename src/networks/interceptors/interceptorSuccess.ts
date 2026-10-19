import { AxiosError, type AxiosResponse } from 'axios';

/**
 * 응답 성공 인터셉터 — HTTP 상태가 2xx 인 모든 응답이 여기를 지난다.
 *
 * 하는 일 두 가지:
 * 1. 이 백엔드는 실패도 HTTP 200 + `success: false` 로 응답한다.
 *    axios 는 HTTP 상태만 보고 성공으로 판단하므로, 여기서 reject 로 바꿔 줘야
 *    위 계층(TanStack Query)이 "reject = 실패"라는 표준 규칙만으로 동작한다.
 *    reject 한 오류는 다음 단계에 등록된 interceptorError 가 받아 메시지를 정리한다.
 * 2. 성공이면 axios 응답 객체(res)가 아니라 본문(res.data)만 넘긴다.
 *    그래서 Repository 가 `httpClient.get<U, U>()` 처럼 응답 타입을 곧 본문 타입으로 쓸 수 있다.
 */
export const interceptorSuccess = (res: AxiosResponse) => {
	const { data } = res;

	// 실패 사유(returnMess)를 오류 메시지로 담고, 원래 응답(res)도 함께 넘겨 interceptorError 가 상태 코드를 읽게 한다
	if (data?.success === false)
		return Promise.reject(
			new AxiosError(data.returnMess, undefined, res.config, res.request, res),
		);

	return data;
};
