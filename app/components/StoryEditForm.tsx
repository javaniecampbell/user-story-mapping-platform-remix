// app/components/StoryEditForm.tsx
import { Form } from "@remix-run/react";
import type { UserStory } from "@prisma/client";

interface StoryEditFormProps {
  story: UserStory;
}

export function StoryEditForm({ story }: StoryEditFormProps) {
  return (
    <Form method="post" className="space-y-4">
      <input type="hidden" name="_action" value="updateStory" />
      <input type="hidden" name="storyId" value={story.id} />
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          type="text"
          name="title"
          id="title"
          defaultValue={story.title}
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
          defaultValue={story.description || ""}
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
          defaultValue={story.type}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="EPIC">Epic</option>
          <option value="FEATURE">Feature</option>
          <option value="STORY">User Story</option>
        </select>
      </div>
      <button
        type="submit"
        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        Update Story
      </button>
    </Form>
  );
}