import type HttpClient from '@/networks/httpClient';
import BaseRepository from '@/repositories/common/baseRepository';
import type { IBook, IBookCopyWithLoan, IBookSearch } from '@/types/book/book';
import type { IRequestBody, IResponseBody } from '@/types/common/repository';

/**
 * 도서 API — URL 과 요청 · 응답 타입만 정한다 (캐시 · 화면 갱신은 BookService 가 맡는다).
 *
 * 작성 규칙 (mes_FE repository-service.md):
 * - 모든 메서드는 `body: IRequestBody<T>` 하나만 받는다. 식별자(bookId)와 저장할 값은 모두 `body.data` 에 넣는다.
 *   → 조회든 저장이든 인자 모양이 같아서 Service 가 `repo.메서드(body)` 로 그대로 넘기면 된다.
 * - httpClient 제네릭은 `<typeof body, IResponseBody<응답 내용>>` — 요청 타입은 body 에서 그대로 따온다.
 * - 전송은 전부 POST 라서 "무슨 동작인지"는 URL 끝(/list · /create · /update · /delete)으로 구분한다.
 */
export default class BookRepository extends BaseRepository {
	constructor(private readonly httpClient: HttpClient) {
		super('/api/books');
	}

	/** 도서 목록 — body 에 페이징(skip · take) · 정렬 · 컬럼 필터 · 검색 조건(data)이 들어 있다 */
	public getBookList = (body: IRequestBody<IBookSearch>) =>
		this.httpClient.get<typeof body, IResponseBody<IBook[]>>(`${this.path}/list`, body);

	/** 한 도서의 낱권 목록 + 낱권별 현재 대출 정보 (도서 상세 모달) */
	public getBookCopies = (body: IRequestBody<{ bookId?: number }>) =>
		this.httpClient.get<typeof body, IResponseBody<IBookCopyWithLoan[]>>(
			`${this.path}/${body.data?.bookId}/copies`,
			body,
		);

	/** 도서 등록 — data 에 입력한 도서 정보 */
	public postBook = (body: IRequestBody<Partial<IBook>>) =>
		this.httpClient.post<typeof body, IResponseBody<IBook>>(`${this.path}/create`, body);

	/** 도서 수정 — data 에 bookId 와 바꿀 값이 함께 들어 있다 */
	public putBook = (body: IRequestBody<Partial<IBook>>) =>
		this.httpClient.put<typeof body, IResponseBody<IBook>>(
			`${this.path}/${body.data?.bookId}/update`,
			body,
		);

	/** 도서 삭제 — 서버는 이력 보존을 위해 소프트 삭제한다 */
	public deleteBook = (body: IRequestBody<{ bookId: number }>) =>
		this.httpClient.delete<typeof body, IResponseBody<null>>(
			`${this.path}/${body.data?.bookId}/delete`,
			body,
		);
}
