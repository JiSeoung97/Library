import CellChip from '@/components/tables/common/cells/CellChip';
import { formatDate } from '@/utils/common/date';
import { formatNumber } from '@/utils/common/number';
import type { MRT_Cell, MRT_ColumnDef, MRT_RowData } from 'material-react-table';
import { useMemo } from 'react';

interface IParams<T extends MRT_RowData> {
	columns: MRT_ColumnDef<T>[];
}

type TSelectOption = { value: string; label?: string };

/**
 * Table.tsx 내부 공통 — filterVariant 만 선언하면 그에 맞는 Cell 을 자동으로 꽂아준다.
 * 컬럼이 Cell 을 직접 지정한 경우에는 항상 그것을 우선한다.
 *
 * mes_FE useTableCore.tsx 축소 이식 — 공통코드 서버 조회(sysConfigCodes)·컬럼 순서 저장·
 * 검색어 하이라이트·커스텀 Filter 슬롯은 이 프로젝트 규모에서 제외.
 */
const useTableCore = <T extends MRT_RowData>({ columns }: IParams<T>) => {
	const resolvedColumns = useMemo(
		() =>
			columns.map(col => {
				// size 를 비율 기준으로 삼아 남는 폭까지 나눠 갖는다 (layoutMode: 'grid').
				// 마지막 컬럼만 grow 를 주면 columnVisibility 로 그 컬럼이 숨겨졌을 때 빈 공간이 남는다.
				const grow = { grow: col.grow ?? true };
				// 컬럼이 Cell 을 직접 지정했으면 그 렌더를 쓰되, 나머지 표시 규칙(grow 등)은 그대로 얹는다 (칸 정렬은 Table 기본값 — 가운데)
				const keepCell = col.Cell ? { Cell: col.Cell } : undefined;

				switch (col.filterVariant) {
					case 'select': {
						const options = col.filterSelectOptions as
							(TSelectOption | string)[] | undefined;

						return {
							...col,
							Cell: ({ cell }: { cell: MRT_Cell<T> }) => {
								const value = cell.getValue<string>();
								const match = options?.find(
									option => typeof option === 'object' && option.value === value,
								);
								const label =
									typeof match === 'object'
										? (match.label ?? match.value)
										: (value ?? '');

								return <CellChip label={label} />;
							},
							...grow,
							...keepCell,
						};
					}

					case 'date-range':
						return {
							...col,
							Cell: ({ cell }: { cell: MRT_Cell<T> }) =>
								formatDate(cell.getValue<string | null>()),
							...grow,
							...keepCell,
						};

					case 'range':
						return {
							...col,
							Cell: ({ cell }: { cell: MRT_Cell<T> }) =>
								formatNumber(cell.getValue<number>()),
							...grow,
							...keepCell,
						};

					default:
						return { ...col, ...grow };
				}
			}),
		[columns],
	);

	return { resolvedColumns };
};

export default useTableCore;
