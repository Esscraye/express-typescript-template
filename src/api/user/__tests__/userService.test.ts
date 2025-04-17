import { StatusCodes } from "http-status-codes"
import { describe, beforeEach, it, expect, vi } from "vitest"

import type { User } from "@/api/user/userModel"

// Mock the userRepository
vi.mock("@/api/user/userRepository", () => {
	return {
		users: [],
		UserRepository: vi.fn().mockImplementation(() => {
			return {
				findAllAsync: vi.fn(),
				findByIdAsync: vi.fn(),
				createAsync: vi.fn(),
				updateAsync: vi.fn(),
				deleteAsync: vi.fn(),
			}
		}),
	}
})

// Import after mocks
import { UserRepository } from "@/api/user/userRepository"
import { UserService } from "@/api/user/userService"

// Define mock users after imports
const mockUsers: User[] = [
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
		name: "Bob",
		email: "bob@example.com",
		age: 21,
		createdAt: new Date(),
		updatedAt: new Date(),
	},
]

describe("userService", () => {
	let userServiceInstance: UserService
	let userRepositoryInstance: any

	beforeEach(() => {
		// Reset mocks
		vi.clearAllMocks()

		// Create a new instance of the mocked repository
		userRepositoryInstance = new UserRepository()

		// Set up the mock methods for each test
		userRepositoryInstance.findAllAsync = vi.fn()
		userRepositoryInstance.findByIdAsync = vi.fn()
		userRepositoryInstance.createAsync = vi.fn()
		userRepositoryInstance.updateAsync = vi.fn()
		userRepositoryInstance.deleteAsync = vi.fn()

		userServiceInstance = new UserService(userRepositoryInstance)
	})

	describe("findAll", () => {
		it("return all users", async () => {
			// Arrange
			userRepositoryInstance.findAllAsync.mockResolvedValue(mockUsers)

			// Act
			const result = await userServiceInstance.findAll()

			// Assert
			expect(result.statusCode).toEqual(StatusCodes.OK)
			expect(result.success).toBeTruthy()
			expect(result.message).toEqual("Users found")
			expect(result.responseObject).toEqual(mockUsers)
		})

		it("returns a not found error for no users found", async () => {
			// Arrange
			userRepositoryInstance.findAllAsync.mockResolvedValue(null)

			// Act
			const result = await userServiceInstance.findAll()

			// Assert
			expect(result.statusCode).toEqual(StatusCodes.NOT_FOUND)
			expect(result.success).toBeFalsy()
			expect(result.message).toEqual("No Users found")
			expect(result.responseObject).toBeNull()
		})

		it("handles errors for findAllAsync", async () => {
			// Arrange
			userRepositoryInstance.findAllAsync.mockRejectedValue(new Error("Database error"))

			// Act
			const result = await userServiceInstance.findAll()

			// Assert
			expect(result.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR)
			expect(result.success).toBeFalsy()
			expect(result.message).toEqual("An error occurred while retrieving users.")
			expect(result.responseObject).toBeNull()
		})
	})

	describe("findById", () => {
		it("returns a user for a valid ID", async () => {
			// Arrange
			const testId = 1
			const mockUser = mockUsers.find((user) => user.id === testId)
			userRepositoryInstance.findByIdAsync.mockResolvedValue(mockUser)

			// Act
			const result = await userServiceInstance.findById(testId)

			// Assert
			expect(result.statusCode).toEqual(StatusCodes.OK)
			expect(result.success).toBeTruthy()
			expect(result.message).toEqual("User found")
			expect(result.responseObject).toEqual(mockUser)
		})

		it("handles errors for findByIdAsync", async () => {
			// Arrange
			const testId = 1
			userRepositoryInstance.findByIdAsync.mockRejectedValue(new Error("Database error"))

			// Act
			const result = await userServiceInstance.findById(testId)

			// Assert
			expect(result.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR)
			expect(result.success).toBeFalsy()
			expect(result.message).toEqual("An error occurred while finding user.")
			expect(result.responseObject).toBeNull()
		})

		it("returns a not found error for non-existent ID", async () => {
			// Arrange
			const testId = 1
			userRepositoryInstance.findByIdAsync.mockResolvedValue(null)

			// Act
			const result = await userServiceInstance.findById(testId)

			// Assert
			expect(result.statusCode).toEqual(StatusCodes.NOT_FOUND)
			expect(result.success).toBeFalsy()
			expect(result.message).toEqual("User not found")
			expect(result.responseObject).toBeNull()
		})
	})

	describe("create", () => {
		it("creates a new user with valid data", async () => {
			// Arrange
			const newUserData = {
				name: "Charlie",
				email: "charlie@example.com",
				age: 30,
			}
			const createdUser = {
				id: 3,
				...newUserData,
				createdAt: new Date(),
				updatedAt: new Date(),
			}
			userRepositoryInstance.findAllAsync.mockResolvedValue(mockUsers)
			userRepositoryInstance.createAsync.mockResolvedValue(createdUser)

			// Act
			const result = await userServiceInstance.create(newUserData)

			// Assert
			expect(result.statusCode).toEqual(StatusCodes.CREATED)
			expect(result.success).toBeTruthy()
			expect(result.message).toEqual("User created successfully")
			expect(result.responseObject).toEqual(createdUser)
		})

		it("returns a conflict error for duplicate email", async () => {
			// Arrange
			const duplicateUserData = {
				name: "Duplicate",
				email: "alice@example.com", // Already exists in mockUsers
				age: 30,
			}
			userRepositoryInstance.findAllAsync.mockResolvedValue(mockUsers)

			// Act
			const result = await userServiceInstance.create(duplicateUserData)

			// Assert
			expect(result.statusCode).toEqual(StatusCodes.CONFLICT)
			expect(result.success).toBeFalsy()
			expect(result.message).toEqual("Email already in use")
			expect(result.responseObject).toBeNull()
		})

		it("handles errors for createAsync", async () => {
			// Arrange
			const newUserData = {
				name: "Charlie",
				email: "charlie@example.com",
				age: 30,
			}
			userRepositoryInstance.findAllAsync.mockResolvedValue(mockUsers)
			userRepositoryInstance.createAsync.mockRejectedValue(new Error("Database error"))

			// Act
			const result = await userServiceInstance.create(newUserData)

			// Assert
			expect(result.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR)
			expect(result.success).toBeFalsy()
			expect(result.message).toEqual("An error occurred while creating user.")
			expect(result.responseObject).toBeNull()
		})
	})

	describe("update", () => {
		it("updates a user with valid data", async () => {
			// Arrange
			const testId = 1
			const updateData = {
				name: "Updated Alice",
				age: 43,
			}
			const existingUser = mockUsers.find((user) => user.id === testId)
			const updatedUser = {
				...existingUser,
				...updateData,
				updatedAt: new Date(),
			}
			userRepositoryInstance.findByIdAsync.mockResolvedValue(existingUser)
			userRepositoryInstance.findAllAsync.mockResolvedValue(mockUsers)
			userRepositoryInstance.updateAsync.mockResolvedValue(updatedUser)

			// Act
			const result = await userServiceInstance.update(testId, updateData)

			// Assert
			expect(result.statusCode).toEqual(StatusCodes.OK)
			expect(result.success).toBeTruthy()
			expect(result.message).toEqual("User updated successfully")
			expect(result.responseObject).toEqual(updatedUser)
		})

		it("returns a not found error for non-existent ID", async () => {
			// Arrange
			const testId = 999
			const updateData = {
				name: "Updated Name",
			}
			userRepositoryInstance.findByIdAsync.mockResolvedValue(null)

			// Act
			const result = await userServiceInstance.update(testId, updateData)

			// Assert
			expect(result.statusCode).toEqual(StatusCodes.NOT_FOUND)
			expect(result.success).toBeFalsy()
			expect(result.message).toEqual("User not found")
			expect(result.responseObject).toBeNull()
		})

		it("returns a conflict error for duplicate email", async () => {
			// Arrange
			const testId = 1
			const updateData = {
				email: "bob@example.com", // Already exists for user with ID 2
			}
			const existingUser = mockUsers.find((user) => user.id === testId)
			userRepositoryInstance.findByIdAsync.mockResolvedValue(existingUser)
			userRepositoryInstance.findAllAsync.mockResolvedValue(mockUsers)

			// Act
			const result = await userServiceInstance.update(testId, updateData)

			// Assert
			expect(result.statusCode).toEqual(StatusCodes.CONFLICT)
			expect(result.success).toBeFalsy()
			expect(result.message).toEqual("Email already in use")
			expect(result.responseObject).toBeNull()
		})

		it("handles errors for updateAsync", async () => {
			// Arrange
			const testId = 1
			const updateData = {
				name: "Updated Name",
			}
			const existingUser = mockUsers.find((user) => user.id === testId)
			userRepositoryInstance.findByIdAsync.mockResolvedValue(existingUser)
			userRepositoryInstance.findAllAsync.mockResolvedValue(mockUsers)
			userRepositoryInstance.updateAsync.mockRejectedValue(new Error("Database error"))

			// Act
			const result = await userServiceInstance.update(testId, updateData)

			// Assert
			expect(result.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR)
			expect(result.success).toBeFalsy()
			expect(result.message).toEqual("An error occurred while updating user.")
			expect(result.responseObject).toBeNull()
		})

		it("returns an error if update fails", async () => {
			// Arrange
			const testId = 1
			const updateData = {
				name: "Updated Name",
			}
			const existingUser = mockUsers.find((user) => user.id === testId)
			userRepositoryInstance.findByIdAsync.mockResolvedValue(existingUser)
			userRepositoryInstance.findAllAsync.mockResolvedValue(mockUsers)
			userRepositoryInstance.updateAsync.mockResolvedValue(null)

			// Act
			const result = await userServiceInstance.update(testId, updateData)

			// Assert
			expect(result.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR)
			expect(result.success).toBeFalsy()
			expect(result.message).toEqual("Failed to update user")
			expect(result.responseObject).toBeNull()
		})
	})

	describe("delete", () => {
		it("deletes a user with valid ID", async () => {
			// Arrange
			const testId = 1
			const existingUser = mockUsers.find((user) => user.id === testId)
			userRepositoryInstance.findByIdAsync.mockResolvedValue(existingUser)
			userRepositoryInstance.deleteAsync.mockResolvedValue(true)

			// Act
			const result = await userServiceInstance.delete(testId)

			// Assert
			expect(result.statusCode).toEqual(StatusCodes.NO_CONTENT)
			expect(result.success).toBeTruthy()
			expect(result.message).toEqual("User deleted successfully")
			expect(result.responseObject).toBeNull()
		})

		it("returns a not found error for non-existent ID", async () => {
			// Arrange
			const testId = 999
			userRepositoryInstance.findByIdAsync.mockResolvedValue(null)

			// Act
			const result = await userServiceInstance.delete(testId)

			// Assert
			expect(result.statusCode).toEqual(StatusCodes.NOT_FOUND)
			expect(result.success).toBeFalsy()
			expect(result.message).toEqual("User not found")
			expect(result.responseObject).toBeNull()
		})

		it("returns an error if delete fails", async () => {
			// Arrange
			const testId = 1
			const existingUser = mockUsers.find((user) => user.id === testId)
			userRepositoryInstance.findByIdAsync.mockResolvedValue(existingUser)
			userRepositoryInstance.deleteAsync.mockResolvedValue(false)

			// Act
			const result = await userServiceInstance.delete(testId)

			// Assert
			expect(result.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR)
			expect(result.success).toBeFalsy()
			expect(result.message).toEqual("Failed to delete user")
			expect(result.responseObject).toBeNull()
		})

		it("handles errors for deleteAsync", async () => {
			// Arrange
			const testId = 1
			const existingUser = mockUsers.find((user) => user.id === testId)
			userRepositoryInstance.findByIdAsync.mockResolvedValue(existingUser)
			userRepositoryInstance.deleteAsync.mockRejectedValue(new Error("Database error"))

			// Act
			const result = await userServiceInstance.delete(testId)

			// Assert
			expect(result.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR)
			expect(result.success).toBeFalsy()
			expect(result.message).toEqual("An error occurred while deleting user.")
			expect(result.responseObject).toBeNull()
		})
	})
})
