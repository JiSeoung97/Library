import { z } from 'zod';

export const required = <T extends z.ZodTypeAny>(schema: T, message = '필수입니다.') => {
	if (schema instanceof z.ZodString) return schema.min(1, message) as unknown as T;
	if (schema instanceof z.ZodNumber) return schema.min(1, message) as unknown as T;
	if (schema instanceof z.ZodArray) return schema.min(1, message) as unknown as T;
	return schema;
};
