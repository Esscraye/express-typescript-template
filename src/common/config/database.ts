import mysql from "mysql2/promise"
import { env } from "@/common/utils/envConfig"
import { logger } from "@/server"

// Create a connection pool
export const pool = mysql.createPool({
	host: env.DB_HOST,
	user: env.DB_USER,
	password: env.DB_PASSWORD,
	database: env.DB_NAME,
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
})

// Test database connection
export async function testConnection(): Promise<boolean> {
	try {
		const connection = await pool.getConnection()
		logger.info("Database connection established successfully")
		connection.release()
		return true
	} catch (error) {
		logger.error(`Database connection failed: ${(error as Error).message}`)
		return false
	}
}

// Initialize database with required tables
export async function initializeDatabase(): Promise<void> {
	try {
		const connection = await pool.getConnection()

		// Create users table if it doesn't exist
		await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        age INT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

		logger.info("Database tables initialized successfully")
		connection.release()
	} catch (error) {
		logger.error(`Database initialization failed: ${(error as Error).message}`)
		throw error
	}
}

