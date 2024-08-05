// app/routes/personas.tsx
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useFetcher, Form } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { db } from "~/utils/db.server";
import { requireUserId } from "~/utils/auth.server";
import { useState } from 'react';
import { ErrorBoundary } from "~/components/ErrorBoundary";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // const userId = await requireUserId(request);
  const personas = await db.persona.findMany({
    // where: { userId },
    select: { id: true, name: true, description: true },
  });
  return json({ personas });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  // const userId = await requireUserId(request);
  const formData = await request.formData();
  const _action = formData.get("_action");

  if (_action === "create") {
    const name = formData.get("name");
    const description = formData.get("description");

    if (typeof name !== "string" || name.length === 0) {
      return json({ error: "Name is required" }, { status: 400 });
    }

    const persona = await db.persona.create({
      data: {
        name,
        description: typeof description === "string" ? description : undefined,
        // userId,
      },
    });

    return json({ success: true, persona });
  }

  if (_action === "delete") {
    const personaId = formData.get("personaId");

    if (typeof personaId !== "string") {
      return json({ error: "Invalid persona ID" }, { status: 400 });
    }

    await db.persona.delete({
      where: { id: personaId },
    });

    return json({ success: true, deletedPersonaId: personaId });
  }

  return json({ error: "Invalid action" }, { status: 400 });
};

export default function Personas() {
  const { personas } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [personaList, setPersonaList] = useState(personas);

  const handleCreatePersona = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.append("_action", "create");
    
    const result = await fetcher.submit(formData, { method: "post" });
    if (result.data.success) {
      setPersonaList([...personaList, result.data.persona]);
      form.reset();
    }
  };

  const handleDeletePersona = async (personaId: string) => {
    if (confirm("Are you sure you want to delete this persona?")) {
      const formData = new FormData();
      formData.append("_action", "delete");
      formData.append("personaId", personaId);
      
      const result = await fetcher.submit(formData, { method: "post" });
      if (result.data.success) {
        setPersonaList(personaList.filter(p => p.id !== personaId));
      }
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">User Personas</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Create New Persona</h2>
        <Form onSubmit={handleCreatePersona} className="space-y-4">
          <div>
            <label htmlFor="name" className="block mb-1">Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label htmlFor="description" className="block mb-1">Description:</label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="w-full px-3 py-2 border rounded"
            ></textarea>
          </div>
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
            Create Persona
          </button>
        </Form>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-2">Existing Personas</h2>
        <ul className="space-y-4">
          {personaList.map(persona => (
            <li key={persona.id} className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-semibold">{persona.name}</h3>
              <p className="text-gray-600">{persona.description}</p>
              <button
                onClick={() => handleDeletePersona(persona.id)}
                className="mt-2 text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// export { ErrorBoundary };