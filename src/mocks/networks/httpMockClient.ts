import type { IRequestBody } from '@/types/common/repository';
import type { DefaultBodyType, HttpHandler } from 'msw';
import { http, HttpResponse } from 'msw';

/**
 * 핸들러가 받는 요청 정보.
 * @generic T 요청 본문의 data 타입 — 핸들러가 `({ body }: IMockContext<IBookSearch>)` 처럼 적으면 body.data 가 그 타입으로 잡힌다
 */
export interface IMockContext<T = unknown> {
	/** 요청 본문 — 조회면 { skip, take, sortings, filtering, data }, 저장이면 { data } */
	body: IRequestBody<T>;
	/** URL 의 `:이름` 자리 값 — 예: '/api/books/:bookId/update' → params.bookId */
	params: Record<string, string>;
}

type TResolver<T, U extends DefaultBodyType> = (context: IMockContext<T>) => U | Promise<U>;

/**
 * mock 서버 쪽의 HttpClient 짝꿍 — MockRepository 가 "이 URL 로 오면 이렇게 응답한다"를 등록하는 곳.
 *
 * 실제 HttpClient 와 같은 규칙을 따른다(mes_FE 동일):
 * - 메서드 이름(get · post · put · patch · delete)은 요청의 의도를 나타낼 뿐이고, 가로채는 HTTP 메서드는 전부 POST 다.
 *   그래서 같은 URL 에 get 과 post 를 둘 다 등록하면 구분되지 않는다 — URL 끝의 동작 이름(/list · /create)으로 나눈다.
 * - 요청 본문은 여기서 한 번만 읽어 IRequestBody 로 넘긴다. 핸들러마다 request.json() 을 부르지 않아도 된다.
 */
export default class HttpMockClient {
	private readonly handlers: HttpHandler[] = [];

	/** 등록된 핸들러 전부 — mocks/handlers 가 모아서 MSW worker 에 넘긴다 */
	public getHandlers = () => [...this.handlers];

	private register = <T, U extends DefaultBodyType>(url: string, resolver: TResolver<T, U>) => {
		this.handlers.push(
			// 앞의 `*` 는 서버 주소(baseURL)가 무엇이든 경로만 맞으면 가로채게 한다
			http.post(`*${url}`, async ({ request, params }) => {
				// 본문 없이 온 요청도 있으므로(text 가 빈 문자열) 빈 객체로 대신한다 → 핸들러는 `body.data ?? {}` 로 안전하게 쓴다
				const text = await request.text();
				const body = (text ? JSON.parse(text) : {}) as IRequestBody<T>;

				return HttpResponse.json(
					await resolver({ body, params: params as Record<string, string> }),
				);
			}),
		);
	};

	/** 조회 */
	public get = <T, U extends DefaultBodyType>(url: string, resolver: TResolver<T, U>) =>
		this.register(url, resolver);

	/** 등록 · 연장 신청 */
	public post = <T, U extends DefaultBodyType>(url: string, resolver: TResolver<T, U>) =>
		this.register(url, resolver);

	/** 전체 수정 */
	public put = <T, U extends DefaultBodyType>(url: string, resolver: TResolver<T, U>) =>
		this.register(url, resolver);

	/** 상태 변경 */
	public patch = <T, U extends DefaultBodyType>(url: string, resolver: TResolver<T, U>) =>
		this.register(url, resolver);

	/** 삭제 */
	public delete = <T, U extends DefaultBodyType>(url: string, resolver: TResolver<T, U>) =>
		this.register(url, resolver);
}
