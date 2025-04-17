import { pool } from "@/common/config/database"
import { logger } from "@/server"

export async function seedDatabase(): Promise<void> {
	try {
		const connection = await pool.getConnection()

		// Check if users table already has data
		const [rows] = await connection.query("SELECT COUNT(*) as count FROM users")
		const count = (rows as any)[0].count

		if (count > 0) {
			logger.info("Database already seeded, skipping seed operation")
			connection.release()
			return
		}

		// Sample user data
		const users = [
			{ name: "Alice Johnson", email: "alice@example.com", age: 32 },
			{ name: "Bob Smith", email: "bob@example.com", age: 45 },
			{ name: "Carol Williams", email: "carol@example.com", age: 28 },
			{ name: "David Brown", email: "david@example.com", age: 39 },
			{ name: "Eva Davis", email: "eva@example.com", age: 24 },
		]

		// Insert sample users
		for (const user of users) {
			await connection.query("INSERT INTO users (name, email, age) VALUES (?, ?, ?)", [user.name, user.email, user.age])
		}

		logger.info("Database seeded successfully with sample data")
		connection.release()
	} catch (error) {
		logger.error(`Database seeding failed: ${(error as Error).message}`)
		throw error
	}
}

