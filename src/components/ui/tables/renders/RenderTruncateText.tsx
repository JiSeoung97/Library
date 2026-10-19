import { Tooltip } from '@mui/material';

interface IProps {
	value: string | null | undefined;
}

/**
 * 긴 글 칸(도서명 · 저자 · 출판사 · 이메일 · 연장 사유) — 칸보다 길면 한 줄로 자르고 "…"를 붙이며, 마우스를 올리면 전체 글을 보여 준다.
 * 칸 폭은 컬럼 너비 규칙(columnWidths)으로 정해져 있어, 글이 길어도 행 높이 · 표 폭이 바뀌지 않게 한다.
 * (MRT 칸은 flex 라 글자에 바로 말줄임이 걸리지 않는다 → 줄어들 수 있는 블록(span)으로 감싼다)
 */
const RenderTruncateText = ({ value }: IProps) => {
	if (!value) return '-';

	return (
		<Tooltip title={value} placement='top-start'>
			<span className='block min-w-0 truncate'>{value}</span>
		</Tooltip>
	);
};

export default RenderTruncateText;
