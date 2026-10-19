import { cn } from '@/utils/common/cn';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { IconButton, Menu } from '@mui/material';
import { useState, type MouseEvent, type ReactNode } from 'react';

interface IProps {
	/** 메뉴 항목들 (<MenuItem>) */
	children: ReactNode;
	/** ⋮ 버튼의 이름 — 스크린 리더가 읽는다 */
	label?: string;
}

/**
 * 메뉴 항목을 하나씩 테두리 박스로 감싼다 — mes_FE MenuCard 와 같은 모양.
 * 글자만 나열된 메뉴는 "눌리는 버튼"으로 보이지 않는다는 1차 발표 피드백 반영:
 * 항목마다 박스 · 둥근 모서리 · 간격을 줘서 각각이 버튼으로 보이게 한다.
 * (항목 쪽 RenderRowCustomActions 는 <MenuItem> 만 그리면 되고, 모양은 여기서 한 번에 정한다)
 */
const MENU_LIST_CLASS = cn(
	'space-y-2 p-2',
	// 항목 = 버튼 박스
	'[&>.MuiMenuItem-root]:min-h-0 [&>.MuiMenuItem-root]:rounded-lg [&>.MuiMenuItem-root]:border [&>.MuiMenuItem-root]:border-solid [&>.MuiMenuItem-root]:border-gray-200 [&>.MuiMenuItem-root]:px-3 [&>.MuiMenuItem-root]:py-2',
	'[&>.MuiMenuItem-root:hover]:border-gray-300 [&>.MuiMenuItem-root:hover]:bg-gray-50',
	// 아이콘과 글자를 붙여 한 덩어리로 — 기본 ListItemIcon 은 최소 폭(36px)이 있어 글자와 멀리 떨어진다
	'[&_.MuiListItemIcon-root]:min-w-0 [&_.MuiListItemIcon-root]:pr-2 [&_.MuiListItemIcon-root]:text-gray-500',
	'[&_.MuiSvgIcon-root]:text-base',
	'[&_.MuiListItemText-primary]:text-sm [&_.MuiListItemText-primary]:font-medium',
);

/**
 * ⋮(더보기) 버튼 + 메뉴 — mes_FE MenuMore 와 같은 구조.
 *
 * - 메뉴 항목을 누르면 메뉴가 자동으로 닫힌다(목록의 onClick 에서 닫는다) — 항목마다 닫기 코드를 쓰지 않아도 된다.
 * - 표의 행에는 클릭 · 더블클릭(상세 모달 열기)이 걸린 경우가 있어, 버튼과 메뉴의 클릭이 행으로 전파되지 않게 막는다.
 */
const MenuMore = ({ children, label = '더보기' }: IProps) => {
	// 메뉴가 붙을 위치(⋮ 버튼) — 값이 있으면 열린 것이다
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const onClose = () => setAnchorEl(null);

	const stop = (e: MouseEvent) => e.stopPropagation();

	return (
		<>
			<IconButton
				size='small'
				aria-label={label}
				onClick={e => {
					stop(e);
					setAnchorEl(e.currentTarget);
				}}
				onDoubleClick={stop}
			>
				<MoreVertIcon fontSize='small' />
			</IconButton>
			<Menu
				anchorEl={anchorEl}
				open={!!anchorEl}
				onClose={onClose}
				// 메뉴는 body 로 옮겨 그려지지만 React 이벤트는 컴포넌트 트리를 따라 행까지 올라간다 → 여기서 끊는다
				onClick={stop}
				onDoubleClick={stop}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				transformOrigin={{ vertical: 'top', horizontal: 'right' }}
				slotProps={{
					list: { onClick: onClose, className: MENU_LIST_CLASS },
					paper: {
						className: 'min-w-32 rounded-xl border border-gray-200 shadow-xs',
						elevation: 0,
					},
				}}
			>
				{children}
			</Menu>
		</>
	);
};

export default MenuMore;
