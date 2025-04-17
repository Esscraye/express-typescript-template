import type { Request, RequestHandler, Response } from "express"

import { userService } from "@/api/user/userService"
import { handleServiceResponse } from "@/common/utils/httpHandlers"
import type { User } from "@/api/user/userModel"

class UserController {
	public getUsers: RequestHandler = async (_req: Request, res: Response) => {
		const serviceResponse = await userService.findAll()
		handleServiceResponse(serviceResponse, res)
	}

	public getUser: RequestHandler = async (req: Request, res: Response) => {
		const id = Number.parseInt(req.params.id as string, 10)
		const serviceResponse = await userService.findById(id)
		handleServiceResponse(serviceResponse, res)
	}

	public createUser: RequestHandler = async (req: Request, res: Response) => {
		const userData = req.body as Omit<User, "id" | "createdAt" | "updatedAt">
		const serviceResponse = await userService.create(userData)
		handleServiceResponse(serviceResponse, res)
	}

	public updateUser: RequestHandler = async (req: Request, res: Response) => {
		const id = Number.parseInt(req.params.id as string, 10)
		const userData = req.body as Partial<Omit<User, "id" | "createdAt" | "updatedAt">>
		const serviceResponse = await userService.update(id, userData)
		handleServiceResponse(serviceResponse, res)
	}

	public deleteUser: RequestHandler = async (req: Request, res: Response) => {
		const id = Number.parseInt(req.params.id as string, 10)
		const serviceResponse = await userService.delete(id)
		handleServiceResponse(serviceResponse, res)
	}
}

export const userController = new UserController()

