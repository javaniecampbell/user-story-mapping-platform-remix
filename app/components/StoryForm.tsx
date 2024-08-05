// app/components/StoryForm.tsx
import { Form, useLoaderData } from "@remix-run/react";
import { Persona } from "@prisma/client";

export function StoryForm() {
  const { personas } = useLoaderData<{ personas: Persona[] }>();
  return (
    <Form method="post" className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          type="text"
          name="title"
          id="title"
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
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        ></textarea>
      </div>
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
          Type
        </label>
        <select
          name="type"
          id="type"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="EPIC">Epic</option>
          <option value="FEATURE">Feature</option>
          <option value="STORY">User Story</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Personas</label>
        <div className="mt-1 space-y-2">
          {personas.map((persona) => (
            <div key={persona.id} className="flex items-center">
              <input
                type="checkbox"
                id={`persona-${persona.id}`}
                name="personaIds"
                value={persona.id}
                defaultChecked={story?.personaIds.includes(persona.id)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor={`persona-${persona.id}`} className="ml-2 text-sm text-gray-900">
                {persona.name}
              </label>
            </div>
          ))}
        </div>
      </div>
      <button
        type="submit"
        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        Create Story
      </button>
    </Form>
  );
}