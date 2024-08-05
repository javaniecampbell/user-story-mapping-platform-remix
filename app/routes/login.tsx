// app/routes/login.tsx

import { useState } from "react";
import { json, redirect } from "@remix-run/node";
import { useActionData, Form } from "@remix-run/react";
import { login, createUserSession } from "~/utils/auth.server";
import type { ActionFunctionArgs } from "@remix-run/node";

export const action = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  const email = form.get("email");
  const password = form.get("password");
  const redirectTo = form.get("redirectTo") || "/dashboard";

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof redirectTo !== "string"
  ) {
    return json({ error: `Invalid form data` }, { status: 400 });
  }

  const user = await login({ email, password });
  if (!user) {
    return json({ error: `Incorrect login` }, { status: 400 });
  }

  return createUserSession(user.id, redirectTo);
};

export default function Login() {
  const actionData = useActionData<typeof action>();
  const [errors, setErrors] = useState(actionData?.error ?? null);

  return (
    <div className="max-w-md mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <Form method="post" className="space-y-4">
        <div>
          <label htmlFor="email" className="block mb-1">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div>
          <label htmlFor="password" className="block mb-1">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            required
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        {errors && <div className="text-red-500">{errors}</div>}
        <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded">
          Log In
        </button>
      </Form>
    </div>
  );
}