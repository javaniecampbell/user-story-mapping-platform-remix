// app/routes/projects.tsx
import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { useActionData } from "@remix-run/react";
import { ProjectForm } from "~/components/ProjectForm";
import { db } from "~/utils/db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const name = formData.get("name");
  const description = formData.get("description");

  if (typeof name !== "string" || name.length === 0) {
    return json({ errors: { name: "Name is required" } }, { status: 400 });
  }

  const project = await db.project.create({
    data: {
      name,
      description: typeof description === "string" ? description : undefined,
    },
  });

  return redirect(`/projects/${project.id}`);
};

export default function Projects() {
  const actionData = useActionData<typeof action>();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Create a New Project</h1>
      <ProjectForm />
      {actionData?.errors && (
        <div className="text-red-500 mt-2">
          {Object.values(actionData.errors).join(", ")}
        </div>
      )}
    </div>
  );
}