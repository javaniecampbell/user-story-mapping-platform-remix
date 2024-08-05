// app/utils/error-handling.server.ts
import { json } from "@remix-run/node";

export function handleErrors(errors: Record<string, string>) {
  return json({ errors }, { status: 400 });
}

export function throwNotFoundError(message: string = "Not Found") {
  throw new Response(message, { status: 404 });
}