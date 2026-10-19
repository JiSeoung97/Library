import MenuMore from '@/components/ui/menus/MenuMore';
import { useConfirm } from '@/contexts/ConfirmGuardProvider';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { ListItemIcon, ListItemText, MenuItem } from '@mui/material';
import type { MRT_RowData } from 'material-react-table';
import type { ElementType } from 'react';

/**
 * 행 동작 하나 — 화면은 버튼을 그리지 않고 이 "데이터"만 돌려준다.
 * 모양(⋮ 메뉴 · 아이콘 · 순서)은 공통 렌더러가 정해서 모든 표가 같아진다.
 */
export interface IRowAction {
	/** 메뉴에 보이는 이름 (예: '승인') */
	label: string;
	/** 이름 앞 아이콘 (예: CheckCircleIcon) */
	Icon: ElementType;
	/** 'error' 면 아이콘을 빨갛게 — 삭제 · 거절 · 취소처럼 되돌리기 어려운 동작 */
	color?: 'error';
	/** 지금은 할 수 없으면 true — 항목은 보이되 회색으로 눌리지 않는다 */
	disabled?: boolean;
	onClick: () => void;
}

/** 행 동작과 관련해 화면이 공통 Table 에 넘기는 옵션 — Table 의 props 에 그대로 합쳐진다 */
export interface IRowActionProps<T extends MRT_RowData> {
	/** 넘기면 메뉴에 "수정"이 생긴다 — 보통 수정 모달을 여는 함수 */
	onUpdateRow?: (row: T) => void;
	/** 넘기면 메뉴에 "삭제"가 생긴다 — 확인창은 여기서 띄우므로 화면은 실제 삭제 요청만 하면 된다 */
	onDeleteRow?: (row: T) => void;
	/** 삭제할 수 없는 행이면 true (예: 이미 탈퇴한 회원) */
	isDeleteRowDisabled?: (row: T) => boolean;
	/** 삭제 확인창 문구 — 생략하면 공통 문구("정말 삭제하시겠습니까?") */
	getDeleteConfirmMessage?: (row: T) => string;
	/** 이름 바꾸기 (예: 회원은 삭제가 아니라 '탈퇴') */
	labels?: { update?: string; delete?: string };
	/**
	 * 수정 · 삭제 외의 화면 고유 동작 (반납 · 연장 승인 · 연장 신청 등).
	 * 행마다 할 수 있는 일이 다르므로 행을 받아 목록을 돌려준다 — 빈 배열이면 그 행에는 ⋮ 버튼이 생기지 않는다.
	 */
	getRowActions?: (row: T) => IRowAction[];
}

interface IProps<T extends MRT_RowData> extends IRowActionProps<T> {
	row: T;
}

/**
 * 테이블 한 행의 "작업" 칸 — ⋮ 버튼 하나를 두고, 누르면 할 수 있는 동작을 메뉴로 보여 준다.
 * mes_FE RenderRowCustomActions 의 메뉴(MenuMore) 모드를 옮겼다.
 *
 * 메뉴로 모은 이유:
 * - 동작 수가 행 · 화면마다 달라도 칸 폭이 항상 같다 (버튼을 늘어놓으면 표마다 작업 칸 폭이 제각각이 된다)
 * - 아이콘만 있는 버튼과 달리 동작 이름이 글자로 보여 무엇을 하는지 바로 안다
 *
 * 순서: 화면 고유 동작 → 수정 → 삭제. 삭제를 맨 아래에 둬 실수로 누르기 어렵게 한다.
 */
const RenderRowCustomActions = <T extends MRT_RowData>({
	row,
	onUpdateRow,
	onDeleteRow,
	isDeleteRowDisabled,
	getDeleteConfirmMessage,
	labels,
	getRowActions,
}: IProps<T>) => {
	const confirm = useConfirm();
	const deleteLabel = labels?.delete ?? '삭제';

	// 삭제는 되돌릴 수 없으므로 항상 확인창을 거친다 — 화면마다 빠뜨리지 않도록 공통 부품에 넣었다
	const handleDelete = async () => {
		const confirmed = await confirm({
			variant: 'delete',
			message: getDeleteConfirmMessage?.(row),
			labels: { confirm: deleteLabel },
		});
		if (confirmed) onDeleteRow?.(row);
	};

	const actions: IRowAction[] = [
		...(getRowActions?.(row) ?? []),
		...(onUpdateRow
			? [{ label: labels?.update ?? '수정', Icon: EditIcon, onClick: () => onUpdateRow(row) }]
			: []),
		...(onDeleteRow
			? [
					{
						label: deleteLabel,
						Icon: DeleteIcon,
						color: 'error' as const,
						disabled: isDeleteRowDisabled?.(row),
						onClick: () => void handleDelete(),
					},
				]
			: []),
	];

	// 이 행에서 할 수 있는 일이 없으면 ⋮ 버튼도 그리지 않는다 (예: 반납이 끝난 대출)
	if (actions.length === 0) return null;

	return (
		<MenuMore label='작업'>
			{actions.map(({ label, Icon, color, disabled, onClick }) => (
				<MenuItem key={label} disabled={disabled} onClick={onClick}>
					<ListItemIcon>
						<Icon fontSize='small' color={color} />
					</ListItemIcon>
					<ListItemText>{label}</ListItemText>
				</MenuItem>
			))}
		</MenuMore>
	);
};

export default RenderRowCustomActions;
