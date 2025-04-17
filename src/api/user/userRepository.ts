import { pool } from "@/common/config/database"
import type { User } from "@/api/user/userModel"
import { logger } from "@/server"

export class UserRepository {
	async findAllAsync(): Promise<User[]> {
		try {
			const [rows] = await pool.query("SELECT * FROM users")
			return (rows as User[]).map((user) => ({
				...user,
				createdAt: new Date(user.createdAt),
				updatedAt: new Date(user.updatedAt),
			}))
		} catch (error) {
			logger.error(`Error finding all users: ${(error as Error).message}`)
			throw error
		}
	}

	async findByIdAsync(id: number): Promise<User | null> {
		try {
			const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id])
			const users = rows as User[]

			if (users.length === 0) {
				return null
			}

			const user = users[0]
			return {
				...user,
				createdAt: new Date(user.createdAt),
				updatedAt: new Date(user.updatedAt),
			}
		} catch (error) {
			logger.error(`Error finding user by id: ${(error as Error).message}`)
			throw error
		}
	}

	async createAsync(user: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
		try {
			const [result] = await pool.query("INSERT INTO users (name, email, age) VALUES (?, ?, ?)", [
				user.name,
				user.email,
				user.age,
			])

			const id = (result as any).insertId
			const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id])
			const users = rows as User[]

			const createdUser = users[0]
			return {
				...createdUser,
				createdAt: new Date(createdUser.createdAt),
				updatedAt: new Date(createdUser.updatedAt),
			}
		} catch (error) {
			logger.error(`Error creating user: ${(error as Error).message}`)
			throw error
		}
	}

	async updateAsync(id: number, user: Partial<Omit<User, "id" | "createdAt" | "updatedAt">>): Promise<User | null> {
		try {
			// Build the SET part of the query dynamically based on provided fields
			const updateFields: string[] = []
			const values: any[] = []

			if (user.name !== undefined) {
				updateFields.push("name = ?")
				values.push(user.name)
			}

			if (user.email !== undefined) {
				updateFields.push("email = ?")
				values.push(user.email)
			}

			if (user.age !== undefined) {
				updateFields.push("age = ?")
				values.push(user.age)
			}

			if (updateFields.length === 0) {
				// No fields to update
				return this.findByIdAsync(id)
			}

			// Add id to values array
			values.push(id)

			const [result] = await pool.query(`UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`, values)

			if ((result as any).affectedRows === 0) {
				return null
			}

			return this.findByIdAsync(id)
		} catch (error) {
			logger.error(`Error updating user: ${(error as Error).message}`)
			throw error
		}
	}

	async deleteAsync(id: number): Promise<boolean> {
		try {
			const [result] = await pool.query("DELETE FROM users WHERE id = ?", [id])
			return (result as any).affectedRows > 0
		} catch (error) {
			logger.error(`Error deleting user: ${(error as Error).message}`)
			throw error
		}
	}
}

// For backward compatibility with existing code
export const users: User[] = []

