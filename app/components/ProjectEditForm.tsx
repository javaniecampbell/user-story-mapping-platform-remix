// app/components/ProjectEditForm.tsx
import { Form } from "@remix-run/react";
import type { Project } from "@prisma/client";

interface ProjectEditFormProps {
  project: Project;
}

export function ProjectEditForm({ project }: ProjectEditFormProps) {
  return (
    <Form method="post" className="space-y-4">
      <input type="hidden" name="_action" value="updateProject" />
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Project Name
        </label>
        <input
          type="text"
          name="name"
          id="name"
          defaultValue={project.name}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          name="description"
          id="description"
          defaultValue={project.description || ""}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        ></textarea>
      </div>
      <button
        type="submit"
        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        Update Project
      </button>
    </Form>
  );
}