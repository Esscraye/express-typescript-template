import { StatusCodes } from "http-status-codes"

import type { User } from "@/api/user/userModel"
import { UserRepository } from "@/api/user/userRepository"
import { ServiceResponse } from "@/common/models/serviceResponse"
import { logger } from "@/server"

export class UserService {
	private userRepository: UserRepository

	constructor(repository: UserRepository = new UserRepository()) {
		this.userRepository = repository
	}

	// Retrieves all users from the database
	async findAll(): Promise<ServiceResponse<User[] | null>> {
		try {
			const users = await this.userRepository.findAllAsync()
			if (!users || users.length === 0) {
				return ServiceResponse.failure("No Users found", null, StatusCodes.NOT_FOUND)
			}
			return ServiceResponse.success<User[]>("Users found", users)
		} catch (ex) {
			const errorMessage = `Error finding all users: ${(ex as Error).message}`
			logger.error(errorMessage)
			return ServiceResponse.failure(
				"An error occurred while retrieving users.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			)
		}
	}

	// Retrieves a single user by their ID
	async findById(id: number): Promise<ServiceResponse<User | null>> {
		try {
			const user = await this.userRepository.findByIdAsync(id)
			if (!user) {
				return ServiceResponse.failure("User not found", null, StatusCodes.NOT_FOUND)
			}
			return ServiceResponse.success<User>("User found", user)
		} catch (ex) {
			const errorMessage = `Error finding user with id ${id}: ${(ex as Error).message}`
			logger.error(errorMessage)
			return ServiceResponse.failure("An error occurred while finding user.", null, StatusCodes.INTERNAL_SERVER_ERROR)
		}
	}

	// Creates a new user
	async create(userData: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<ServiceResponse<User | null>> {
		try {
			// Check if email already exists
			const users = await this.userRepository.findAllAsync()
			const emailExists = users.some((user) => user.email === userData.email)

			if (emailExists) {
				return ServiceResponse.failure("Email already in use", null, StatusCodes.CONFLICT)
			}

			const user = await this.userRepository.createAsync(userData)
			return ServiceResponse.success<User>("User created successfully", user, StatusCodes.CREATED)
		} catch (ex) {
			const errorMessage = `Error creating user: ${(ex as Error).message}`
			logger.error(errorMessage)
			return ServiceResponse.failure("An error occurred while creating user.", null, StatusCodes.INTERNAL_SERVER_ERROR)
		}
	}

	// Updates an existing user
	async update(
		id: number,
		userData: Partial<Omit<User, "id" | "createdAt" | "updatedAt">>,
	): Promise<ServiceResponse<User | null>> {
		try {
			// Check if user exists
			const existingUser = await this.userRepository.findByIdAsync(id)
			if (!existingUser) {
				return ServiceResponse.failure("User not found", null, StatusCodes.NOT_FOUND)
			}

			// Check if email is being updated and if it already exists
			if (userData.email && userData.email !== existingUser.email) {
				const users = await this.userRepository.findAllAsync()
				const emailExists = users.some((user) => user.email === userData.email && user.id !== id)

				if (emailExists) {
					return ServiceResponse.failure("Email already in use", null, StatusCodes.CONFLICT)
				}
			}

			const updatedUser = await this.userRepository.updateAsync(id, userData)
			if (!updatedUser) {
				return ServiceResponse.failure("Failed to update user", null, StatusCodes.INTERNAL_SERVER_ERROR)
			}

			return ServiceResponse.success<User>("User updated successfully", updatedUser)
		} catch (ex) {
			const errorMessage = `Error updating user with id ${id}: ${(ex as Error).message}`
			logger.error(errorMessage)
			return ServiceResponse.failure("An error occurred while updating user.", null, StatusCodes.INTERNAL_SERVER_ERROR)
		}
	}

	// Deletes a user
	async delete(id: number): Promise<ServiceResponse<null>> {
		try {
			// Check if user exists
			const existingUser = await this.userRepository.findByIdAsync(id)
			if (!existingUser) {
				return ServiceResponse.failure("User not found", null, StatusCodes.NOT_FOUND)
			}

			const deleted = await this.userRepository.deleteAsync(id)
			if (!deleted) {
				return ServiceResponse.failure("Failed to delete user", null, StatusCodes.INTERNAL_SERVER_ERROR)
			}

			return ServiceResponse.success<null>("User deleted successfully", null, StatusCodes.NO_CONTENT)
		} catch (ex) {
			const errorMessage = `Error deleting user with id ${id}: ${(ex as Error).message}`
			logger.error(errorMessage)
			return ServiceResponse.failure("An error occurred while deleting user.", null, StatusCodes.INTERNAL_SERVER_ERROR)
		}
	}
}

export const userService = new UserService()
