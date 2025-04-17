import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi"
import { z } from "zod"

import { commonValidations } from "@/common/utils/commonValidation"

extendZodWithOpenApi(z)

export type User = z.infer<typeof UserSchema>
export const UserSchema = z.object({
	id: z.number(),
	name: z.string(),
	email: z.string().email(),
	age: z.number(),
	createdAt: z.date(),
	updatedAt: z.date(),
})

// Input Validation for 'GET users/:id' endpoint
export const GetUserSchema = z.object({
	params: z.object({ id: commonValidations.id }),
})

// Input Validation for 'POST users' endpoint
export const CreateUserSchema = z.object({
	body: z.object({
		name: z.string().min(2, "Name must be at least 2 characters"),
		email: z.string().email("Invalid email format"),
		age: z.number().int().min(0, "Age must be a positive number").optional(),
	}),
})

// Input Validation for 'PUT users/:id' endpoint
export const UpdateUserSchema = z.object({
	params: z.object({ id: commonValidations.id }),
	body: z
		.object({
			name: z.string().min(2, "Name must be at least 2 characters").optional(),
			email: z.string().email("Invalid email format").optional(),
			age: z.number().int().min(0, "Age must be a positive number").optional(),
		})
		.refine((data) => Object.keys(data).length > 0, {
			message: "At least one field must be provided for update",
		}),
})

// Input Validation for 'DELETE users/:id' endpoint
export const DeleteUserSchema = z.object({
	params: z.object({ id: commonValidations.id }),
})

