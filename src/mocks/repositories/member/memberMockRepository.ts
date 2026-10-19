import type { IMockContext } from '@/mocks/networks/httpMockClient';
import { faker, fakerKO } from '@faker-js/faker';

import BaseMockRepository from '@/mocks/repositories/common/baseMockRepository';
import type { IResponseBody, ISortings } from '@/types/common/repository';
import type { IMember, IMemberSearch, TMemberDisplayStatus } from '@/types/member/member';

// mock 저장 전용 — 응답(IMember)에는 노출하지 않는 비밀번호를 내부 보관
interface IMemberRecord extends IMember {
	password: string;
}

// 화면 Chip 과 같은 기준 — 정상 회원 중 연체 건이 있으면 연체로 본다
const toDisplayStatus = (member: IMember): TMemberDisplayStatus =>
	member.status === 'ACTIVE' && member.overdueCount > 0 ? 'OVERDUE' : member.status;

// 숫자만 남긴다 — 연락처 검색에서 하이픈 · 괄호 · 공백을 무시하려고
const toDigits = (value: string) => value.replace(/\D/g, '');

// 상태 정렬 순서 (오름차순 기준) — 정상 → 탈퇴 → 연체.
// 내림차순이면 연체 → 탈퇴 → 정상으로, 관리자가 먼저 챙겨야 할 회원이 위로 온다.
// 저장값(ACTIVE · WITHDRAWN)이나 화면 옵션 순서로 정렬하면 연체(파생 상태)가 정상 사이에 섞이거나 순서가 달라져 따로 정한다
const STATUS_SORT_ORDER: TMemberDisplayStatus[] = ['ACTIVE', 'WITHDRAWN', 'OVERDUE'];

// 회원 목록 기본 순서 (정렬 조건이 없을 때) — 상태 내림차순(연체 → 탈퇴 → 정상) 다음 회원번호 오름차순
const DEFAULT_MEMBER_SORTINGS: ISortings[] = [
	{ columName: 'statusRank', typeSorting: 'DESC' },
	{ columName: 'memberCode', typeSorting: 'ASC' },
];

const toMember = ({ password: _password, ...member }: IMemberRecord): IMember => member;

export default class MemberMockRepository extends BaseMockRepository<IMemberRecord> {
	private sequence = 0;

	// 회원의 반납 전 대출(대출중·연체) 건수 — 대출 저장소가 회원 저장소보다 나중에 생성되므로
	// 생성 후 handlers/index.ts 에서 주입한다
	private countActiveLoans: (memberId: number) => number = () => 0;

	public setActiveLoanCounter(counter: (memberId: number) => number): void {
		this.countActiveLoans = counter;
	}

	constructor() {
		super();
		this.seed(20, () => this.createItem());
		// 데모 로그인용 고정 계정 — 관리자 계정은 별도 테이블(AdminMockRepository)에 있다
		this.items.unshift(
			this.createFixed({ loginId: 'member', password: 'member1234', name: '홍길동' }),
		);
	}

	protected getId = (item: IMemberRecord): number => item.memberId;

	private createFixed(overrides: Partial<IMemberRecord>): IMemberRecord {
		return this.createItem({ overdueCount: 0, status: 'ACTIVE', ...overrides });
	}

	protected createItem(overrides: Partial<IMemberRecord> = {}): IMemberRecord {
		this.sequence += 1;
		const now = new Date().toISOString();

		return {
			memberId: this.sequence,
			memberCode: overrides.memberCode ?? `M-${String(this.sequence).padStart(4, '0')}`,
			// 한국어 이름 — 이름만 한국어 faker(fakerKO)로 만든다 (이메일 · 아이디는 영문이 자연스러워 기본 faker)
			name: fakerKO.person.fullName(),
			// 국내 휴대전화 형식 010-0000-0000 — 화면 입력 규칙(schemas/web/member)과 같은 모양으로 만든다
			phone: `010-${faker.string.numeric(4)}-${faker.string.numeric(4)}`,
			email: faker.internet.email(),
			loginId: faker.internet.username(),
			password: faker.internet.password(),
			status: 'ACTIVE',
			joinedAt: faker.date.past({ years: 2 }).toISOString(),
			withdrawnAt: null,
			overdueCount: 0,
			createdAt: now,
			updatedAt: now,
			...overrides,
		};
	}

	public getMemberById(memberId: number): IMember | undefined {
		const member = this.findById(memberId);
		return member && toMember(member);
	}

	public findByCredentials(loginId: string, password: string): IMember | undefined {
		const member = this.items.find(
			item => item.loginId === loginId && item.password === password,
		);
		return member && toMember(member);
	}

	// 연체 건수 갱신 (loanMockRepository 에서 대출/반납 시 호출)
	public setOverdueCount(memberId: number, overdueCount: number): void {
		const member = this.findById(memberId);
		if (!member) return;
		this.update(memberId, { overdueCount });
	}

	public getMemberList = this.httpMockClient.get(
		'/api/members/list',
		async ({ body }: IMockContext<IMemberSearch>): Promise<IResponseBody<IMember[]>> => {
			const { name, phone, status, email } = body.data ?? {};
			// 연락처는 숫자만 비교한다 — 저장 형식(010-1234-5678)과 입력 형식(01012345678 · 5678)이 달라도 찾을 수 있게
			const phoneDigits = toDigits(phone ?? '');

			// 상태는 연체가 파생값이라 컬럼 헤더 필터도 검색창과 같은 기준(toDisplayStatus)으로 거른다
			const statusFilter = body.filtering?.find(f => f.columName === 'status');
			const restFiltering = body.filtering?.filter(f => f.columName !== 'status');

			// 항목별 조건은 모두 AND — 빈 값은 조건에서 빠진다
			const filtered = this.items.filter(
				member =>
					this.matchesFilter(member, 'name', name) &&
					this.matchesFilter(member, 'email', email) &&
					(!phoneDigits || toDigits(member.phone).includes(phoneDigits)) &&
					(!status || toDisplayStatus(member) === status) &&
					(!statusFilter || toDisplayStatus(member) === statusFilter.valueDefault),
			);
			// 상태 정렬은 저장값이 아니라 화면에 보이는 상태의 순번(statusRank, STATUS_SORT_ORDER)으로 한다
			const rows = filtered.map(member => ({
				member,
				...member,
				statusRank: STATUS_SORT_ORDER.indexOf(toDisplayStatus(member)),
			}));
			// 기본 순서는 서버가 정한다 — 정렬 조건이 없으면 상태 내림차순(연체 → 탈퇴 → 정상) 다음 회원번호 오름차순.
			// 화면 헤더에는 사용자가 직접 고른 정렬만 보이도록, 기본 순서는 화면의 정렬 상태로 보내지 않는다
			// 사용자가 고른 정렬 뒤에는 회원번호 오름차순을 붙인다 — 값이 같은 행끼리도 항상 같은 순서로 보이게(예: 연체 회원끼리)
			const sortings = body.sortings?.length
				? [
						...body.sortings.map(sort =>
							sort.columName === 'status'
								? { ...sort, columName: 'statusRank' }
								: sort,
						),
						...(body.sortings.some(sort => sort.columName === 'memberCode')
							? []
							: [{ columName: 'memberCode', typeSorting: 'ASC' } as const]),
					]
				: DEFAULT_MEMBER_SORTINGS;
			const { items, total } = this.query(rows, {
				...body,
				sortings,
				filtering: restFiltering,
			});

			return {
				success: true,
				returnMess: '',
				data: items.map(row => toMember(row.member)),
				totalRecords: total,
			};
		},
	);

	// 로그인 아이디 중복 확인 — 등록 폼에서 저장 전에 미리 확인한다
	public getLoginIdAvailability = this.httpMockClient.get(
		'/api/members/login-id/availability',
		async ({
			body,
		}: IMockContext<{ loginId: string }>): Promise<IResponseBody<{ available: boolean }>> => {
			// 아이디는 URL 이 아니라 본문의 data 로 온다 — URL 에 넣으면 특수문자 인코딩을 따로 챙겨야 한다
			const loginId = body.data?.loginId ?? '';
			const taken = this.items.some(member => member.loginId === loginId);

			return {
				success: true,
				returnMess: taken ? '이미 사용 중인 아이디입니다.' : '사용할 수 있는 아이디입니다.',
				data: { available: !taken },
			};
		},
	);

	public getMember = this.httpMockClient.get(
		'/api/members/:memberId/detail',
		async ({ params }): Promise<IResponseBody<IMember | null>> => {
			const member = this.findById(Number(params.memberId));
			return {
				success: !!member,
				returnMess: member ? '' : '회원을 찾을 수 없습니다.',
				data: member ? toMember(member) : null,
			};
		},
	);

	public postMember = this.httpMockClient.post(
		'/api/members/create',
		async ({
			body,
		}: IMockContext<Partial<IMemberRecord>>): Promise<IResponseBody<IMember | null>> => {
			const { data = {} } = body;

			// 비밀번호 없이 만들면 로그인할 수 없는 계정이 된다
			if (!data.password)
				return { success: false, returnMess: '비밀번호를 입력해주세요.', data: null };
			if (this.items.some(member => member.loginId === data.loginId))
				return { success: false, returnMess: '이미 사용 중인 아이디입니다.', data: null };

			const created = this.create(data);
			return { success: true, returnMess: '', data: toMember(created) };
		},
	);

	public putMember = this.httpMockClient.put(
		'/api/members/:memberId/update',
		async ({
			body,
			params,
		}: IMockContext<Partial<IMemberRecord>>): Promise<IResponseBody<IMember | null>> => {
			const memberId = Number(params.memberId);
			const { data = {} } = body;

			// 비밀번호를 보내지 않았으면 기존 값을 유지한다 (빈 문자열로 덮어쓰지 않도록)
			if (!data.password) delete data.password;

			const updated = this.update(memberId, data);
			return { success: true, returnMess: '', data: toMember(updated) };
		},
	);

	public deleteMember = this.httpMockClient.delete(
		'/api/members/:memberId/delete',
		async ({ params }): Promise<IResponseBody<IMember | null>> => {
			const memberId = Number(params.memberId);
			const member = this.findById(memberId);
			if (!member)
				return { success: false, returnMess: '회원을 찾을 수 없습니다.', data: null };
			if (member.status === 'WITHDRAWN')
				return { success: false, returnMess: '이미 탈퇴 처리된 회원입니다.', data: null };
			if (this.countActiveLoans(memberId) > 0)
				return {
					success: false,
					returnMess: '반납하지 않은 도서가 있어 탈퇴 처리할 수 없습니다.',
					data: null,
				};

			const updated = this.update(memberId, {
				status: 'WITHDRAWN',
				withdrawnAt: new Date().toISOString(),
			});
			return { success: true, returnMess: '', data: toMember(updated) };
		},
	);
}
