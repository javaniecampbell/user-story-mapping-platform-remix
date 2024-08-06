// app/routes/projects.$projectId.journeys.tsx
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useFetcher, Form } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { db } from "~/utils/db.server";
import { requireUserId } from "~/utils/auth.server";
import { useState } from 'react';
import { ErrorBoundary } from "~/components/ErrorBoundary";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const { projectId } = params;

  if (!projectId) {
    throw new Response("Not Found", { status: 404 });
  }

  const project = await db.project.findFirst({
    where: { id: projectId, userId },
    include: {
      userStories: true,
      personas: true,
      journeys: {
        include: {
          steps: {
            include: {
              userStory: true
            }
          },
          persona: true
        }
      }
    }
  });

  if (!project) {
    throw new Response("Not Found", { status: 404 });
  }
  let personas = await db.persona.findMany({
    // where: { userId },
    select: { id: true, name: true },
  });
  return json({ project, personas });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  const { projectId } = params;

  if (!projectId) {
    throw new Response("Not Found", { status: 404 });
  }

  const formData = await request.formData();
  const _action = formData.get("_action");

  if (_action === "generateJourney") {
    const name = formData.get("name");
    const description = formData.get("description");
    const personaId = formData.get("personaId");
    const storyIds = formData.getAll("storyIds");

    if (typeof name !== "string" || typeof personaId !== "string" || !Array.isArray(storyIds)) {
      return json({ error: "Invalid form data" }, { status: 400 });
    }

    const journey = await db.journey.create({
      data: {
        name,
        description: typeof description === "string" ? description : undefined,
        projectId,
        personaId,
        steps: {
          create: storyIds.map((storyId, index) => ({
            order: index,
            description: `Step ${index + 1}`,
            userStoryId: storyId,
          })),
        },
      },
      include: {
        steps: {
          include: {
            userStory: true,
          },
        },
        persona: true,
      },
    });

    return json({ success: true, journey });
  }

  return json({ error: "Invalid action" }, { status: 400 });
};

export default function JourneyGeneration() {
  const { project, personas } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [selectedPersona, setSelectedPersona] = useState<string>("");
  const [selectedStories, setSelectedStories] = useState<string[]>([]);

  const handlePersonaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPersona(e.target.value);
  };

  const handleStoryToggle = (storyId: string) => {
    setSelectedStories(prev => 
      prev.includes(storyId)
        ? prev.filter(id => id !== storyId)
        : [...prev, storyId]
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append("_action", "generateJourney");
    selectedStories.forEach(storyId => formData.append("storyIds", storyId));
    fetcher.submit(formData, { method: "post" });
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Generate User Journey</h1>
      
      <Form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Journey Name</label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          ></textarea>
        </div>
        
        <div>
          <label htmlFor="personaId" className="block text-sm font-medium text-gray-700">Select Persona</label>
          <select
            id="personaId"
            name="personaId"
            required
            value={selectedPersona}
            onChange={handlePersonaChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">Select a persona</option>
            {personas.map(persona => (
              <option key={persona.id} value={persona.id}>{persona.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <span className="block text-sm font-medium text-gray-700">Select User Stories</span>
          <div className="mt-1 space-y-2">
            {project.userStories.map(story => (
              <div key={story.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`story-${story.id}`}
                  checked={selectedStories.includes(story.id)}
                  onChange={() => handleStoryToggle(story.id)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor={`story-${story.id}`} className="ml-2 text-sm text-gray-900">
                  {story.title}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Generate Journey
        </button>
      </Form>

      <div>
        <h2 className="text-xl font-semibold mb-4">Existing Journeys</h2>
        <ul className="space-y-4">
          {project.journeys.map(journey => (
            <li key={journey.id} className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-semibold">{journey.name}</h3>
              <p className="text-gray-600">{journey.description}</p>
              <p className="text-sm text-gray-500">Persona: {journey.persona.name}</p>
              <ol className="mt-2 list-decimal list-inside">
                {journey.steps.map(step => (
                  <li key={step.id}>{step.userStory.title}</li>
                ))}
              </ol>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export { ErrorBoundary };