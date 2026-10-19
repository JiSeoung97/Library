import { TextField, type TextFieldProps } from '@mui/material';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';

interface IProps<T extends FieldValues> extends Omit<TextFieldProps, 'name'> {
	name: Path<T>;
	control: Control<T>;
}

/**
 * react-hook-form 필드에 묶인 TextField — 검증 오류가 있으면 helperText 자리에 오류 메시지를 띄운다.
 * type='number' 면 입력값을 숫자로 바꿔 폼에 넣는다(스키마가 z.number() 라서).
 */
const TextFieldController = <T extends FieldValues>({
	name,
	control,
	helperText,
	...fieldProps
}: IProps<T>) => (
	<Controller
		name={name}
		control={control}
		render={({ field, fieldState }) => (
			<TextField
				{...field}
				fullWidth
				{...fieldProps}
				onChange={e =>
					field.onChange(
						fieldProps.type === 'number' ? Number(e.target.value) : e.target.value,
					)
				}
				error={!!fieldState.error}
				helperText={fieldState.error?.message ?? helperText}
			/>
		)}
	/>
);

export default TextFieldController;
