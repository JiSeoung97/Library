import { LOGIN_ID_MAX_LENGTH, PASSWORD_MAX_LENGTH } from '@/consts/common/auth';
import HttpMockClient, { type IMockContext } from '@/mocks/networks/httpMockClient';
import type AdminMockRepository from '@/mocks/repositories/admin/adminMockRepository';
import type MemberMockRepository from '@/mocks/repositories/member/memberMockRepository';
import type { IAuthAdmin, IAuthMember, ILoginRequest, ILoginResponse } from '@/types/auth/auth';
import type { IResponseBody } from '@/types/common/repository';

const INVALID_CREDENTIALS = '아이디 또는 비밀번호가 올바르지 않습니다.';

/**
 * 길이 제한을 넘는 입력은 계정을 찾거나 비밀번호를 비교(실제 서버라면 해시 계산)하기 전에 바로 거절한다.
 * 화면 검증은 브라우저를 거치지 않는 요청(curl · 스크립트)에는 걸리지 않으므로 서버도 같은 값으로 거른다.
 * 거절 문구는 "틀렸다"와 같게 둬서 어떤 제한에 걸렸는지 드러내지 않는다.
 */
const isWithinLength = (loginId: string, password: string) =>
	loginId.length <= LOGIN_ID_MAX_LENGTH && password.length <= PASSWORD_MAX_LENGTH;

/**
 * 로그인 API — 관리자 · 회원 진입점을 나눈다.
 * 각 API 는 자기 테이블만 조회한다. 그래서 회원 로그인 화면에 관리자 아이디를 넣으면 "없는 계정"이 되고,
 * 탭으로 역할을 고르던 때처럼 "고른 역할과 계정 역할이 맞는지" 따로 검사할 필요가 없다.
 */
export default class AuthMockRepository {
	private readonly httpMockClient = new HttpMockClient();

	constructor(
		private readonly adminRepo: AdminMockRepository,
		private readonly memberRepo: MemberMockRepository,
	) {}

	public getHandlers = () => this.httpMockClient.getHandlers();

	/** 회원 로그인 — 회원 테이블에서만 찾는다 */
	public postLogin = this.httpMockClient.post(
		'/api/auth/login',
		async ({
			body,
		}: IMockContext<ILoginRequest>): Promise<
			IResponseBody<ILoginResponse<IAuthMember> | null>
		> => {
			const { loginId = '', password = '' } = body.data ?? {};
			if (!isWithinLength(loginId, password))
				return { success: false, returnMess: INVALID_CREDENTIALS, data: null };

			const member = this.memberRepo.findByCredentials(loginId, password);

			if (!member) return { success: false, returnMess: INVALID_CREDENTIALS, data: null };

			if (member.status === 'WITHDRAWN')
				return {
					success: false,
					returnMess: '탈퇴한 회원은 로그인할 수 없습니다.',
					data: null,
				};

			return {
				success: true,
				returnMess: '',
				data: {
					token: `mock-token-member-${member.memberId}`,
					user: {
						role: 'MEMBER',
						memberId: member.memberId,
						memberCode: member.memberCode,
						name: member.name,
					},
				},
			};
		},
	);

	/** 관리자 로그인 — 관리자 테이블에서만 찾는다 */
	public postAdminLogin = this.httpMockClient.post(
		'/api/auth/admin/login',
		async ({
			body,
		}: IMockContext<ILoginRequest>): Promise<
			IResponseBody<ILoginResponse<IAuthAdmin> | null>
		> => {
			const { loginId = '', password = '' } = body.data ?? {};
			if (!isWithinLength(loginId, password))
				return { success: false, returnMess: INVALID_CREDENTIALS, data: null };

			const admin = this.adminRepo.findByCredentials(loginId, password);

			if (!admin) return { success: false, returnMess: INVALID_CREDENTIALS, data: null };

			return {
				success: true,
				returnMess: '',
				data: {
					token: `mock-token-admin-${admin.adminId}`,
					user: {
						role: 'ADMIN',
						adminId: admin.adminId,
						adminCode: admin.adminCode,
						name: admin.name,
					},
				},
			};
		},
	);
}
