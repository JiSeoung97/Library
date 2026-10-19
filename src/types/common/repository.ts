/*
 * 모든 도메인이 함께 쓰는 "요청 · 응답의 공통 모양".
 * 도메인별 타입(도서 · 회원 · 대출)은 types/{도메인}/ 에 두고, 어느 도메인에도 속하지 않는 통신 규약만 여기에 둔다.
 * (폴더 규칙은 mes_FE directory-structure.md 의 `types/{module}/{name}.ts` 를 따른다)
 */

export type TSortDirection = 'ASC' | 'DESC';

/** 정렬 조건 한 개 — 필드 이름(columName 철자 포함)은 mes_FE 서버 규약과 같게 둔다 */
export interface ISortings {
	/** 정렬할 컬럼 */
	columName: string;
	typeSorting: TSortDirection;
}

/** 사용자 역할 — 관리자(사서) / 회원. 계정이 어느 테이블에 있는지를 나타내며, 화면 접근 권한(guardRole)과 첫 화면이 이 값으로 갈린다 */
export type TRole = 'ADMIN' | 'MEMBER';

/** 컬럼 필터 비교 방식 — Contains: 포함하면 일치, Equal: 완전히 같아야 일치 */
export type TTypeFilter = 'Contains' | 'Equal';

/** 표 헤더의 컬럼 필터 한 개 */
export interface IFiltering {
	columName: string;
	typeFilter: TTypeFilter;
	/** 비교할 값 */
	valueDefault: string;
}

/**
 * 모든 요청의 공통 본문 — 조회든 저장이든 이 모양 하나로 보낸다 (mes_FE IRequestBody).
 * - 조회: skip · take · sortings · filtering · data(검색 조건 · 식별자)
 * - 저장: data(저장할 값과 식별자)만
 * @generic T data 의 타입
 */
export interface IRequestBody<T = unknown> {
	/** 검색 조건 · 식별자 · 저장할 값 */
	data?: T;
	/** 페이징: 몇 번째 행부터 (0 부터) */
	skip?: number;
	/** 페이징: 몇 건 가져올지 (0 = 전부) */
	take?: number;
	sortings?: ISortings[];
	/** material-react-table 컬럼 헤더 필터 */
	filtering?: IFiltering[];
}

/**
 * 모든 API 응답의 공통 봉투 — 필드 이름은 mes_FE 와 같게 맞춘다(returnMess · totalRecords).
 * 실패도 HTTP 200 으로 오고 `success: false` + `returnMess`(사유)로 구분한다 → interceptorSuccess 가 오류로 바꾼다.
 */
export interface IResponseBody<T> {
	/** 처리 성공 여부 — false 면 returnMess 에 사용자에게 보여줄 사유가 들어 있다 */
	success: boolean;
	/** 서버가 내려주는 안내 문구 (실패 사유 등). 성공이면 보통 빈 문자열 */
	returnMess: string;
	/** 실제 응답 내용 — 목록이면 배열, 단건이면 객체, 실패면 null */
	data: T;
	/** 목록 조회 시 조건에 맞는 전체 건수 — 현재 페이지 건수가 아니라 페이징 계산용 총합 */
	totalRecords?: number;
}
