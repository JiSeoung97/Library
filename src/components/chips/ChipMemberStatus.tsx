import { MEMBER_STATUS_OPTIONS } from '@/consts/member/member';
import type { IMember } from '@/types/member/member';
import { Chip } from '@mui/material';

interface IProps {
	member: IMember;
}

/** 회원 상태 — 연체는 status 가 아니라 별도 카운트라, 정상 회원 중 연체 건이 있으면 그것을 먼저 알린다 */
const ChipMemberStatus = ({ member }: IProps) => {
	if (member.status === 'ACTIVE' && member.overdueCount > 0)
		return <Chip size='small' color='error' label={`연체 ${member.overdueCount}건`} />;

	const option = MEMBER_STATUS_OPTIONS.find(o => o.value === member.status);
	return <Chip size='small' color={option?.color} label={option?.label} />;
};

export default ChipMemberStatus;
