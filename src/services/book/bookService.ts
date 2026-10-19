import { QUERY_KEYS } from '@/consts/common/queryKeys';
import type BookRepository from '@/repositories/book/bookRepository';
import BaseService from '@/services/common/baseService';
import type { IBook, IBookSearch } from '@/types/book/book';
import type { IRequestBody } from '@/types/common/repository';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';

/**
 * 도서의 서버 상태 — Repository 요청을 TanStack Query 훅으로 감싼다.
 *
 * 작성 규칙 (mes_FE repository-service.md):
 * - 훅 이름 = `use` + Repository 메서드 이름 (1:1). 예: getBookList → useGetBookList
 * - 조회 훅은 `body: IRequestBody` 하나만 받는다. 식별자는 `body.data` 에 넣고 `enabled: !!body.data?.id` 로 조회 여부를 정한다.
 * - 쓰기 훅은 `{ data }` 를 받는다 → 화면은 항상 `mutate({ data: 보낼 값 })` 한 가지 모양으로 부른다.
 */
export default class BookService extends BaseService {
	constructor(private readonly bookRepository: BookRepository) {
		super();
	}

	/**
	 * 도서 목록.
	 * queryKey 에 body(조회 조건)가 들어 있어서 페이지 · 정렬 · 검색이 바뀌면 키가 바뀌고 자동으로 다시 조회된다.
	 * keepPreviousData — 새 조건을 불러오는 동안 이전 목록을 그대로 보여 줘 표가 깜빡이지 않는다.
	 */
	public useGetBookList = (body: IRequestBody<IBookSearch>) =>
		useQuery({
			queryKey: this.keyOf(QUERY_KEYS.BOOK_LIST, body),
			queryFn: () => this.bookRepository.getBookList(body),
			placeholderData: keepPreviousData,
		});

	/**
	 * 한 도서의 낱권 목록 (도서 상세 모달).
	 * enabled — bookId 가 없으면 요청하지 않는다 (모달이 대상을 받기 전에 헛요청이 나가지 않게).
	 */
	public useGetBookCopies = (body: IRequestBody<{ bookId?: number }>) =>
		useQuery({
			queryKey: this.keyOf(QUERY_KEYS.BOOK_COPIES, body),
			queryFn: () => this.bookRepository.getBookCopies(body),
			enabled: !!body.data?.bookId,
			placeholderData: keepPreviousData,
		});

	// 도서가 바뀌면 함께 달라지는 캐시를 한 번에 무효화한다 — 권수가 바뀌면 낱권 목록과 대시보드의 전체 도서 수도 달라진다
	private invalidateBookQueries = () =>
		this.invalidate(QUERY_KEYS.BOOK_LIST, QUERY_KEYS.BOOK_COPIES, QUERY_KEYS.LOAN_SUMMARY);

	/** 도서 등록 — 호출: `mutate({ data: 폼 값 })` */
	public usePostBook = () =>
		useMutation({
			mutationFn: ({ data }: Pick<IRequestBody<Partial<IBook>>, 'data'>) =>
				this.bookRepository.postBook({ data }),
			onSuccess: this.invalidateBookQueries,
		});

	/** 도서 수정 — 호출: `mutate({ data: { bookId, ...폼 값 } })` */
	public usePutBook = () =>
		useMutation({
			mutationFn: ({ data }: Pick<IRequestBody<Partial<IBook>>, 'data'>) =>
				this.bookRepository.putBook({ data }),
			onSuccess: this.invalidateBookQueries,
		});

	/** 도서 삭제 — 호출: `mutate({ data: { bookId } })` */
	public useDeleteBook = () =>
		useMutation({
			mutationFn: ({ data }: Pick<IRequestBody<{ bookId: number }>, 'data'>) =>
				this.bookRepository.deleteBook({ data }),
			onSuccess: this.invalidateBookQueries,
		});
}
