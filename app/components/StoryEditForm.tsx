// app/components/StoryEditForm.tsx
import { useState } from "react"
import { Form, useLoaderData, useFetcher } from "@remix-run/react";
import { Persona } from "@prisma/client";

interface StoryEditFormProps {
  story?: {
    id: string;
    title: string;
    description?: string | null;
    type: string;
    personaIds: string[];
  };
}

export function StoryEditForm({ story }: StoryEditFormProps) {
  const { personas } = useLoaderData<{ personas: Persona[] }>();
  const [title, setTitle] = useState(story?.title || "");
  const [description, setDescription] = useState(story?.description || "");
  const fetcher = useFetcher();

  const handleGenerateIdeas = () => {
    fetcher.submit(
      { _action: "generateIdeas", prompt: title },
      { method: "post" }
    );
  };

  const handleRefineStory = () => {
    fetcher.submit(
      { _action: "refineStory", story: `Title: ${title}\nDescription: ${description}` },
      { method: "post" }
    );
  };
  return (
    <Form method="post" className="space-y-4">
      <input type="hidden" name="_action" value="updateStory" />
      <input type="hidden" name="storyId" value={story?.id} />
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <input
            type="text"
            name="title"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="flex-1 rounded-none rounded-l-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          <button
            type="button"
            onClick={handleGenerateIdeas}
            className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500 hover:bg-gray-100"
          >
            Generate Ideas
          </button>
        </div>
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <div className="mt-1">
          <textarea
            name="description"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          ></textarea>
        </div>
        <button
          type="button"
          onClick={handleRefineStory}
          className="mt-2 inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Refine Story
        </button>
      </div>
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
          Type
        </label>
        <select
          name="type"
          id="type"
          defaultValue={story?.type}
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
        Update Story
      </button>
      <>
        {fetcher.data && (
          <div className="mt-4 p-4 bg-gray-100 rounded-md">
            <h3 className="font-semibold">AI Suggestions:</h3>
            <p>{fetcher.data?.suggestion}</p>
            <button
              type="button"
              onClick={() => {
                if (fetcher.data?._action === "generateIdeas") {
                  setTitle(fetcher.data?.suggestion);
                } else if (fetcher.data?._action === "refineStory") {
                  const [refinedTitle, ...refinedDescriptionParts] = fetcher.data?.suggestion?.split("\n");
                  setTitle(refinedTitle);
                  setDescription(refinedDescriptionParts.join("\n"));
                }
              }}
              className="mt-2 inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Use Suggestion
            </button>
          </div>
        )}
      </>
    </Form>
  );
}