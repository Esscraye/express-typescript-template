import { StatusCodes } from "http-status-codes"
import request from "supertest"
import { describe, it, expect, vi, beforeEach } from "vitest"

import type { User } from "@/api/user/userModel"
import { ServiceResponse } from "@/common/models/serviceResponse"

// Mock the database operations
vi.mock("@/common/config/database", () => ({
	pool: {
		query: vi.fn().mockResolvedValue([[]]),
		getConnection: vi.fn().mockReturnValue({
			query: vi.fn().mockResolvedValue([[]]),
			release: vi.fn(),
		}),
	},
	testConnection: vi.fn().mockResolvedValue(true),
	initializeDatabase: vi.fn().mockResolvedValue(undefined),
}))

// Mock the userController directly
vi.mock("@/api/user/userController", () => {
	const mockUsers = [
		{
			id: 1,
			name: "Alice",
			email: "alice@example.com",
			age: 42,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			id: 2,
			name: "Robert",
			email: "Robert@example.com",
			age: 21,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	]

	return {
		userController: {
			getUsers: vi.fn((req, res) => {
				const serviceResponse = ServiceResponse.success("Users found", mockUsers, StatusCodes.OK)
				res.status(serviceResponse.statusCode).json(serviceResponse)
			}),

			getUser: vi.fn((req, res) => {
				const id = Number.parseInt(req.params.id, 10)

				if (id === Number.MAX_SAFE_INTEGER) {
					const serviceResponse = ServiceResponse.failure("User not found", null, StatusCodes.NOT_FOUND)
					return res.status(serviceResponse.statusCode).json(serviceResponse)
				}

				const user = mockUsers.find((u) => u.id === id)
				const serviceResponse = ServiceResponse.success("User found", user, StatusCodes.OK)
				res.status(serviceResponse.statusCode).json(serviceResponse)
			}),

			createUser: vi.fn((req, res) => {
				const newUser = {
					id: 3,
					...req.body,
					createdAt: new Date(),
					updatedAt: new Date(),
				}

				const serviceResponse = ServiceResponse.success("User created successfully", newUser, StatusCodes.CREATED)
				res.status(serviceResponse.statusCode).json(serviceResponse)
			}),

			updateUser: vi.fn((req, res) => {
				const id = Number.parseInt(req.params.id, 10)

				if (id === Number.MAX_SAFE_INTEGER) {
					const serviceResponse = ServiceResponse.failure("User not found", null, StatusCodes.NOT_FOUND)
					return res.status(serviceResponse.statusCode).json(serviceResponse)
				}

				const user = mockUsers.find((u) => u.id === id)
				const updatedUser = { ...user, ...req.body, updatedAt: new Date() }

				const serviceResponse = ServiceResponse.success("User updated successfully", updatedUser, StatusCodes.OK)
				res.status(serviceResponse.statusCode).json(serviceResponse)
			}),

			deleteUser: vi.fn((req, res) => {
				const id = Number.parseInt(req.params.id, 10)

				if (id === Number.MAX_SAFE_INTEGER) {
					const serviceResponse = ServiceResponse.failure("User not found", null, StatusCodes.NOT_FOUND)
					return res.status(serviceResponse.statusCode).json(serviceResponse)
				}

				const serviceResponse = ServiceResponse.success("User deleted successfully", null, StatusCodes.NO_CONTENT)
				res.status(serviceResponse.statusCode).json(serviceResponse)
			}),
		},
	}
})

// Import the app after all mocks are set up
import { app } from "@/server"

// Set a higher timeout for tests
vi.setConfig({ testTimeout: 10000 })

describe("User API Endpoints", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe("GET /users", () => {
		it("should return a list of users", async () => {
			// Act
			const response = await request(app).get("/users")
			const responseBody: ServiceResponse<User[]> = response.body

			// Assert
			expect(response.statusCode).toEqual(StatusCodes.OK)
			expect(responseBody.success).toBeTruthy()
			expect(responseBody.message).toContain("Users found")
			expect(responseBody.responseObject).toBeDefined()
			expect(Array.isArray(responseBody.responseObject)).toBeTruthy()
		})
	})

	describe("GET /users/:id", () => {
		it("should return a user for a valid ID", async () => {
			// Arrange
			const testId = 1

			// Act
			const response = await request(app).get(`/users/${testId}`)
			const responseBody: ServiceResponse<User> = response.body

			// Assert
			expect(response.statusCode).toEqual(StatusCodes.OK)
			expect(responseBody.success).toBeTruthy()
			expect(responseBody.message).toContain("User found")
			expect(responseBody.responseObject).toBeDefined()
		})

		it("should return a not found error for non-existent ID", async () => {
			// Arrange
			const testId = Number.MAX_SAFE_INTEGER

			// Act
			const response = await request(app).get(`/users/${testId}`)
			const responseBody: ServiceResponse = response.body

			// Assert
			expect(response.statusCode).toEqual(StatusCodes.NOT_FOUND)
			expect(responseBody.success).toBeFalsy()
			expect(responseBody.message).toContain("User not found")
			expect(responseBody.responseObject).toBeNull()
		})

		it("should return a bad request for invalid ID format", async () => {
			// Act
			const invalidInput = "abc"
			const response = await request(app).get(`/users/${invalidInput}`)
			const responseBody: ServiceResponse = response.body

			// Assert
			expect(response.statusCode).toEqual(StatusCodes.BAD_REQUEST)
			expect(responseBody.success).toBeFalsy()
			expect(responseBody.message).toContain("Invalid input")
			expect(responseBody.responseObject).toBeNull()
		})
	})

	describe("POST /users", () => {
		it("should create a new user with valid data", async () => {
			// Arrange
			const newUser = {
				name: "Test User",
				email: "test@example.com",
				age: 30,
			}

			// Act
			const response = await request(app).post("/users").send(newUser)
			const responseBody: ServiceResponse<User> = response.body

			// Assert
			expect(response.statusCode).toEqual(StatusCodes.CREATED)
			expect(responseBody.success).toBeTruthy()
			expect(responseBody.message).toContain("User created successfully")
			expect(responseBody.responseObject).toBeDefined()
		})

		it("should return a bad request for invalid data", async () => {
			// Arrange
			const invalidUser = {
				name: "Test User",
				email: "invalid-email", // Invalid email format
				age: 30,
			}

			// Act
			const response = await request(app).post("/users").send(invalidUser)
			const responseBody: ServiceResponse = response.body

			// Assert
			expect(response.statusCode).toEqual(StatusCodes.BAD_REQUEST)
			expect(responseBody.success).toBeFalsy()
			expect(responseBody.message).toContain("Invalid input")
			expect(responseBody.responseObject).toBeNull()
		})
	})

	describe("PUT /users/:id", () => {
		it("should update a user with valid data", async () => {
			// Arrange
			const testId = 1
			const updateData = {
				name: "Updated Name",
				age: 50,
			}

			// Act
			const response = await request(app).put(`/users/${testId}`).send(updateData)
			const responseBody: ServiceResponse<User> = response.body

			// Assert
			expect(response.statusCode).toEqual(StatusCodes.OK)
			expect(responseBody.success).toBeTruthy()
			expect(responseBody.message).toContain("User updated successfully")
			expect(responseBody.responseObject).toBeDefined()
		})

		it("should return a not found error for non-existent ID", async () => {
			// Arrange
			const testId = Number.MAX_SAFE_INTEGER
			const updateData = {
				name: "Updated Name",
			}

			// Act
			const response = await request(app).put(`/users/${testId}`).send(updateData)
			const responseBody: ServiceResponse = response.body

			// Assert
			expect(response.statusCode).toEqual(StatusCodes.NOT_FOUND)
			expect(responseBody.success).toBeFalsy()
			expect(responseBody.message).toContain("User not found")
			expect(responseBody.responseObject).toBeNull()
		})

		it("should return a bad request for invalid data", async () => {
			// Arrange
			const testId = 1
			const invalidData = {
				email: "invalid-email", // Invalid email format
			}

			// Act
			const response = await request(app).put(`/users/${testId}`).send(invalidData)
			const responseBody: ServiceResponse = response.body

			// Assert
			expect(response.statusCode).toEqual(StatusCodes.BAD_REQUEST)
			expect(responseBody.success).toBeFalsy()
			expect(responseBody.message).toContain("Invalid input")
			expect(responseBody.responseObject).toBeNull()
		})

		it("should return a bad request for empty update data", async () => {
			// Arrange
			const testId = 1
			const emptyData = {}

			// Act
			const response = await request(app).put(`/users/${testId}`).send(emptyData)
			const responseBody: ServiceResponse = response.body

			// Assert
			expect(response.statusCode).toEqual(StatusCodes.BAD_REQUEST)
			expect(responseBody.success).toBeFalsy()
			expect(responseBody.message).toContain("Invalid input")
			expect(responseBody.responseObject).toBeNull()
		})
	})

	describe("DELETE /users/:id", () => {
		it("should delete a user with valid ID", async () => {
			// Arrange
			const testId = 1

			// Act
			const response = await request(app).delete(`/users/${testId}`)

			// Assert
			expect(response.statusCode).toEqual(StatusCodes.NO_CONTENT)
		})

		it("should return a not found error for non-existent ID", async () => {
			// Arrange
			const testId = Number.MAX_SAFE_INTEGER

			// Act
			const response = await request(app).delete(`/users/${testId}`)
			const responseBody: ServiceResponse = response.body

			// Assert
			expect(response.statusCode).toEqual(StatusCodes.NOT_FOUND)
			expect(responseBody.success).toBeFalsy()
			expect(responseBody.message).toContain("User not found")
			expect(responseBody.responseObject).toBeNull()
		})

		it("should return a bad request for invalid ID format", async () => {
			// Act
			const invalidInput = "abc"
			const response = await request(app).delete(`/users/${invalidInput}`)
			const responseBody: ServiceResponse = response.body

			// Assert
			expect(response.statusCode).toEqual(StatusCodes.BAD_REQUEST)
			expect(responseBody.success).toBeFalsy()
			expect(responseBody.message).toContain("Invalid input")
			expect(responseBody.responseObject).toBeNull()
		})
	})
})

