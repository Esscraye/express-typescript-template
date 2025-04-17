import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi"
import express, { type Router } from "express"
import { z } from "zod"
import { StatusCodes } from "http-status-codes"

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders"
import { GetUserSchema, UserSchema, CreateUserSchema, UpdateUserSchema, DeleteUserSchema } from "@/api/user/userModel"
import { validateRequest } from "@/common/utils/httpHandlers"
import { userController } from "./userController"

export const userRegistry = new OpenAPIRegistry()
export const userRouter: Router = express.Router()

userRegistry.register("User", UserSchema)

// GET /users - Get all users
userRegistry.registerPath({
	method: "get",
	path: "/users",
	tags: ["User"],
	responses: createApiResponse(z.array(UserSchema), "Success"),
})

userRouter.get("/", userController.getUsers)

// GET /users/:id - Get user by ID
userRegistry.registerPath({
	method: "get",
	path: "/users/{id}",
	tags: ["User"],
	request: { params: GetUserSchema.shape.params },
	responses: createApiResponse(UserSchema, "Success"),
})

userRouter.get("/:id", validateRequest(GetUserSchema), userController.getUser)

// POST /users - Create a new user
userRegistry.registerPath({
	method: "post",
	path: "/users",
	tags: ["User"],
	request: {
		body: {
			content: {
				"application/json": {
					schema: CreateUserSchema.shape.body,
				},
			},
		},
	},
	responses: {
		...createApiResponse(UserSchema, "User created successfully", StatusCodes.CREATED),
		[StatusCodes.CONFLICT]: {
			description: "Email already in use",
			content: {
				"application/json": {
					schema: z.object({
						success: z.boolean(),
						message: z.string(),
						responseObject: z.null(),
						statusCode: z.number(),
					}),
				},
			},
		},
	},
})

userRouter.post("/", validateRequest(CreateUserSchema), userController.createUser)

// PUT /users/:id - Update a user
userRegistry.registerPath({
	method: "put",
	path: "/users/{id}",
	tags: ["User"],
	request: {
		params: UpdateUserSchema.shape.params,
		body: {
			content: {
				"application/json": {
					schema: UpdateUserSchema.shape.body,
				},
			},
		},
	},
	responses: {
		...createApiResponse(UserSchema, "User updated successfully"),
		[StatusCodes.NOT_FOUND]: {
			description: "User not found",
			content: {
				"application/json": {
					schema: z.object({
						success: z.boolean(),
						message: z.string(),
						responseObject: z.null(),
						statusCode: z.number(),
					}),
				},
			},
		},
		[StatusCodes.CONFLICT]: {
			description: "Email already in use",
			content: {
				"application/json": {
					schema: z.object({
						success: z.boolean(),
						message: z.string(),
						responseObject: z.null(),
						statusCode: z.number(),
					}),
				},
			},
		},
	},
})

userRouter.put("/:id", validateRequest(UpdateUserSchema), userController.updateUser)

// DELETE /users/:id - Delete a user
userRegistry.registerPath({
	method: "delete",
	path: "/users/{id}",
	tags: ["User"],
	request: { params: DeleteUserSchema.shape.params },
	responses: {
		...createApiResponse(z.null(), "User deleted successfully", StatusCodes.NO_CONTENT),
		[StatusCodes.NOT_FOUND]: {
			description: "User not found",
			content: {
				"application/json": {
					schema: z.object({
						success: z.boolean(),
						message: z.string(),
						responseObject: z.null(),
						statusCode: z.number(),
					}),
				},
			},
		},
	},
})

userRouter.delete("/:id", validateRequest(DeleteUserSchema), userController.deleteUser)

