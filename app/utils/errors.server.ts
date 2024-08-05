// app/utils/errors.server.ts
import { json } from "@remix-run/node";

export function badRequest(data: any) {
    return json(data, { status: 400 });
}

export function unauthorized(data: any) {
    return json(data, { status: 401 });
}

export function forbidden(data: any) {
    return json(data, { status: 403 });
}

export function notFound(data: any) {
    return json(data, { status: 404 });
}

export function serverError(data: any) {
    console.error("Server error:", data);
    return json({ message: "An unexpected error occurred" }, { status: 500 });
}

export function isServerError(error: unknown): error is Error {
    return error instanceof Error;
}