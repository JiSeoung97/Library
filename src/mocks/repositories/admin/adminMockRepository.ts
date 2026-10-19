import BaseMockRepository from '@/mocks/repositories/common/baseMockRepository';
import type { IAdmin } from '@/types/admin/admin';

// mock 저장 전용 — 응답(IAdmin)에는 노출하지 않는 비밀번호를 내부 보관
interface IAdminRecord extends IAdmin {
	password: string;
}

const toAdmin = ({ password: _password, ...admin }: IAdminRecord): IAdmin => admin;

/**
 * 관리자(사서) 테이블 — 회원 테이블과 따로 둔다 (types/admin/admin.ts 참고).
 * 관리자 계정은 내부에서 발급하므로 등록 · 목록 API 가 없고, 로그인(AuthMockRepository)에서만 조회한다.
 */
export default class AdminMockRepository extends BaseMockRepository<IAdminRecord> {
	private sequence = 0;

	constructor() {
		super();
		// 데모 로그인용 고정 계정
		this.items = [this.createItem({ loginId: 'admin', password: 'admin1234', name: '김사서' })];
	}

	protected getId = (item: IAdminRecord): number => item.adminId;

	protected createItem(overrides: Partial<IAdminRecord> = {}): IAdminRecord {
		this.sequence += 1;
		const now = new Date().toISOString();

		return {
			adminId: this.sequence,
			adminCode: `A-${String(this.sequence).padStart(4, '0')}`,
			name: '',
			loginId: '',
			password: '',
			createdAt: now,
			updatedAt: now,
			...overrides,
		};
	}

	public findByCredentials(loginId: string, password: string): IAdmin | undefined {
		const admin = this.items.find(
			item => item.loginId === loginId && item.password === password,
		);
		return admin && toAdmin(admin);
	}
}
