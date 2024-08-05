// app/routes/projects.tsx
import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useActionData, useLoaderData, Form, Link } from "@remix-run/react";
import { ProjectForm } from "~/components/ProjectForm";
import { db } from "~/utils/db.server";


export const loader = async ({ }: LoaderFunctionArgs) => {
  const projects = await db.project.findMany({
    select: { id: true, name: true },
    orderBy: { createdAt: 'desc' },
  });
  return json({ projects });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const _action = formData.get("_action");


  if (_action === "deleteProject") {
    const projectId = formData.get("projectId");
    if (typeof projectId !== "string") {
      return json({ error: "Invalid project ID" }, { status: 400 });
    }
    await db.project.delete({
      where: { id: projectId },
    });
    return json({ success: true });
  } else if (_action === "createProject") {


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
  }
  return json({ error: "Invalid action" }, { status: 400 });
};

export default function Projects() {
  const { projects } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Create a New Project</h1>
      <ul className="space-y-4">
        {projects.map((project) => (
          <li key={project.id} className="flex items-center justify-between bg-white p-4 rounded shadow">
            <Link to={`/projects/${project.id}`} className="text-blue-500 hover:underline">
              {project.name}
            </Link>
            <Form method="post">
              <input type="hidden" name="_action" value="deleteProject" />
              <input type="hidden" name="projectId" value={project.id} />
              <button
                type="submit"
                className="text-red-500 hover:text-red-700"
                onClick={(e) => {
                  if (!confirm("Are you sure you want to delete this project?")) {
                    e.preventDefault();
                  }
                }}
              >
                Delete
              </button>
            </Form>
          </li>
        ))}
      </ul>
      <ProjectForm />
      {actionData?.errors && (
        <div className="text-red-500 mt-2">
          {Object.values(actionData.errors).join(", ")}
        </div>
      )}
    </div>
  );
}