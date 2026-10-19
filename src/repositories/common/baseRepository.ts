/**
 * 모든 Repository 의 부모 — 그 도메인 API 의 기본 경로(path)만 가진다.
 * 예) BookRepository 는 `super('/api/books')` → 메서드에서 `${this.path}/list` 처럼 쓴다.
 * 경로를 한 곳에서 정해 두면 서버 주소 체계가 바뀔 때 생성자 한 줄만 고치면 된다.
 */
export default abstract class BaseRepository {
	constructor(protected readonly path: string) {}
}
