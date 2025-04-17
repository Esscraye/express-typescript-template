import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { ZodError, ZodSchema } from "zod";

import { ServiceResponse } from "@/common/models/serviceResponse";

export const handleServiceResponse = (serviceResponse: ServiceResponse<unknown> | undefined, response: Response) => {
	// Handle the case where serviceResponse is undefined
	if (!serviceResponse) {
		return response.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
			success: false,
			message: "An unexpected error occurred: Service response is undefined",
			responseObject: null,
			statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
		})
	}

	return response.status(serviceResponse.statusCode).send(serviceResponse);
};

export const validateRequest = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
	try {
		schema.parse({ body: req.body, query: req.query, params: req.params });
		next();
	} catch (err) {
		const errorMessage = `Invalid input: ${(err as ZodError).errors.map((e) => e.message).join(", ")}`;
		const statusCode = StatusCodes.BAD_REQUEST;
		const serviceResponse = ServiceResponse.failure(errorMessage, null, statusCode);
		handleServiceResponse(serviceResponse, res);
	}
};
