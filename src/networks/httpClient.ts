import { interceptorError } from '@/networks/interceptors/interceptorError';
import { interceptorSuccess } from '@/networks/interceptors/interceptorSuccess';
import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';

/**
 * 실제 통신을 맡는 계층(Networks) — axios 를 감싸 공통 설정과 인터셉터를 한 곳에 둔다.
 * Repository 는 axios 를 직접 모르고 이 클래스의 메서드만 부른다.
 *
 * ■ 전송 규칙 (mes_FE 와 동일)
 *   메서드 이름(get · post · put · patch · delete)은 "무슨 의도의 요청인가"를 나타낼 뿐이고,
 *   실제 전송은 전부 HTTP POST 다. 조회 조건도 URL(?q=) 이 아니라 요청 본문(body)에 담는다.
 *
 * ■ 왜 전부 POST 인가
 *   - GET 은 본문을 실을 수 없어 페이징 · 정렬 · 필터 조건을 URL 에 JSON 으로 욱여넣어야 했다(길고 읽기 어렵다).
 *   - 조회든 저장이든 같은 모양(IRequestBody)의 본문을 주고받으면 프론트와 서버의 규약이 하나로 통일된다.
 *   - 대신 "어떤 동작인지"는 HTTP 메서드가 아니라 URL 끝의 동작 이름(/list · /create · /5/update)으로 구분한다.
 */
export default class HttpClient {
	private readonly axios: AxiosInstance;

	constructor(baseURL: string) {
		if (!baseURL) throw new Error('VITE_API_BASE_URL 은 필수입니다.');

		this.axios = axios.create({
			baseURL, // 모든 요청 URL 앞에 붙는 서버 주소 (.env 의 VITE_API_BASE_URL)
			timeout: 30_000, // 30초 안에 응답이 없으면 실패 처리
			withCredentials: true, // 쿠키를 함께 보낸다
		});

		// 응답 인터셉터 — 성공 처리와 실패 처리를 "따로" 등록한다.
		// 같은 use() 에 함께 넣으면 axios 가 then(성공, 실패) 한 쌍으로 연결해서,
		// interceptorSuccess 가 reject 한 오류(success:false)를 interceptorError 가 받지 못한다.
		this.axios.interceptors.response.use(interceptorSuccess);
		this.axios.interceptors.response.use(undefined, interceptorError);
	}

	/**
	 * 요청 인터셉터 등록 — 모든 요청에 로그인 토큰을 붙인다.
	 * 생성자에서 바로 등록하지 않고 토큰을 "얻는 함수"를 나중에 주입받는 이유:
	 * HttpClient 가 AuthService 를 직접 import 하면 AuthService → Repository → HttpClient 로 순환 의존이 생긴다.
	 */
	public loadInterceptors = (getToken: () => string | null) => {
		this.axios.interceptors.request.use(config => {
			const token = getToken();
			if (token) config.headers.set('Authorization', `Bearer ${token}`);
			return config;
		});
	};

	/**
	 * 모든 메서드가 공유하는 실제 전송 — 항상 POST 로 body 를 보낸다.
	 * @generic T 요청 본문 타입
	 * @generic U 응답 본문 타입 (interceptorSuccess 가 res.data 만 넘기므로 axios 응답이 아니라 본문 타입이다)
	 */
	private send = <T, U>(url: string, body?: T, config?: AxiosRequestConfig) =>
		this.axios.post<U, U, T>(url, body, config);

	/** 조회 — 목록이면 body 에 페이징 · 정렬 · 필터 · 검색 조건을 담는다 */
	public get = async <T, U>(url: string, body?: T, config?: AxiosRequestConfig) =>
		this.send<T, U>(url, body, config);

	/** 등록 · 대출 처리처럼 새로 만드는 요청 */
	public post = async <T, U>(url: string, body?: T, config?: AxiosRequestConfig) =>
		this.send<T, U>(url, body, config);

	/** 전체 수정 */
	public put = async <T, U>(url: string, body?: T, config?: AxiosRequestConfig) =>
		this.send<T, U>(url, body, config);

	/** 상태만 바꾸는 부분 수정 (연장 승인 · 반납 등) */
	public patch = async <T, U>(url: string, body?: T, config?: AxiosRequestConfig) =>
		this.send<T, U>(url, body, config);

	/** 삭제 */
	public delete = async <T, U>(url: string, body?: T, config?: AxiosRequestConfig) =>
		this.send<T, U>(url, body, config);
}
