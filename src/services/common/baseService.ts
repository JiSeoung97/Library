import type { TQueryKey } from '@/consts/common/queryKeys';
import { queryClient } from '@/contexts/QueryProvider';

/**
 * 모든 Service 의 부모 — 쿼리 키를 만들고 캐시를 무효화하는 방법을 한 곳에서 정한다.
 *
 * ■ 쿼리 키의 모양: [접두어, ...조건]
 *   예) ['book-list', { skip: 0, take: 20, data: { title: '해리' } }]
 *   - 조건이 다르면 다른 캐시다 → 페이지 · 검색어가 바뀌면 새로 조회하고, 되돌아오면 캐시를 그대로 쓴다.
 *
 * ■ 무효화는 접두어만으로
 *   `invalidate('book-list')` 는 조건과 상관없이 'book-list' 로 시작하는 캐시를 전부 "낡음"으로 표시한다.
 *   지금 화면에 보이는 목록은 즉시 다시 조회되고, 안 보이는 목록은 다음에 볼 때 조회된다.
 *   → 저장 뒤에 화면이 목록을 직접 다시 부르지 않아도 된다.
 *
 * ■ 접두어를 상수(QUERY_KEYS)로 모아 둔 이유
 *   대출 하나가 바뀌면 도서 재고 · 회원 연체 수도 바뀌어서, 대출 Service 가 도서 · 회원 캐시까지 무효화해야 한다.
 *   서비스끼리 서로의 키를 알아야 하므로 한 파일(consts/common/queryKeys.ts)에서 관리한다.
 */
export default abstract class BaseService {
	/** 쿼리 키 만들기 — 접두어 뒤에 조회 조건을 그대로 붙인다 */
	protected keyOf = (key: TQueryKey, ...params: unknown[]) => [key, ...params];

	/** 접두어가 같은 쿼리를 조회 조건과 무관하게 모두 다시 조회하게 한다 (여러 접두어를 한 번에 넘길 수 있다) */
	protected invalidate = (...keys: TQueryKey[]) =>
		Promise.all(keys.map(key => queryClient.invalidateQueries({ queryKey: [key] })));
}
