// app/routes/projects.$projectId.tsx
import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, useFetcher } from "@remix-run/react";
import { useState, useEffect } from 'react';
import { BoardView } from "~/components/BoardView";
import { BoardView as BoardViewV2 } from "~/components/BoardView.v2";
import { StoryForm } from "~/components/StoryForm";
import { ProjectEditForm } from "~/components/ProjectEditForm";
import { StoryEditForm } from "~/components/StoryEditForm";
import { db } from "~/utils/db.server";
import { validateRequired, validateType } from "~/utils/validation.server";
import { handleErrors, throwNotFoundError } from "~/utils/error-handling.server";
import type { DropResult } from 'react-beautiful-dnd';

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const project = await db.project.findUnique({
    where: { id: params.projectId },
    include: { userStories: true },
  });

  if (!project) {
    throwNotFoundError("Project not found");
  }

  return json({ project });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const _action = formData.get("_action");

  switch (_action) {
    case "updateProject": {
      const name = formData.get("name");
      const description = formData.get("description");

      const nameError = validateRequired(name, "Project name");
      if (nameError) return handleErrors({ name: nameError });

      await db.project.update({
        where: { id: params.projectId },
        data: {
          name: name as string,
          description: description as string,
        },
      });

      return json({ success: true, action: "updateProject" });
    }

    case "updateStory": {
      const storyId = formData.get("storyId");
      const title = formData.get("title");
      const description = formData.get("description");
      const type = formData.get("type");

      const titleError = validateRequired(title, "Title");
      const typeError = validateType(type, "Type", "string");

      if (titleError || typeError) {
        return handleErrors({ title: titleError!, type: typeError! });
      }

      const updateStory = await db.userStory.update({
        where: { id: storyId as string },
        data: {
          title: title as string,
          description: description as string,
          type: type as "EPIC" | "FEATURE" | "STORY",
        },
      });

      return json({ success: true, action: "updateStory", story: updatedStory });
    }
    case "updateStoryType": {
      const storyId = formData.get("storyId");
      const newType = formData.get("newType");

      const storyIdError = validateRequired(storyId, "Story ID");
      const newTypeError = validateType(newType, "New Type", "string");

      if (storyIdError !== null || newTypeError !== null) {
        return handleErrors({ storyId: storyIdError!, newType: newTypeError! });
      }

      const updatedStory = await db.userStory.update({
        where: { id: storyId as string },
        data: { type: newType as "EPIC" | "FEATURE" | "STORY" },
      });

      return json({ success: true, action: "updateStoryType", story: updatedStory });
    }

    default: {
      // Handle story creation (existing code)
      const title = formData.get("title");
      const description = formData.get("description");
      const type = formData.get("type");

      if (typeof title !== "string" || title.length === 0) {
        return json({ errors: { title: "Title is required" } }, { status: 400 });
      }

      if (typeof type !== "string" || !["EPIC", "FEATURE", "STORY"].includes(type)) {
        return json({ errors: { type: "Invalid story type" } }, { status: 400 });
      }

      // const titleError = validateRequired(title, "Title");
      // const typeError = validateType(type, "Type", "string");

      // if (titleError || typeError) {
      //   return handleErrors({ title: titleError, type: typeError });
      // }
      const story = await db.userStory.create({
        data: {
          title,
          description: typeof description === "string" ? description : undefined,
          type: type as "EPIC" | "FEATURE" | "STORY",
          projectId: params.projectId!,
        },
      });

      return json({ success: true, action: "createStory", story: story });
    }
  }
};

export default function ProjectDetail() {
  const { project } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const fetcher = useFetcher();
  const [stories, setStories] = useState(project?.userStories);
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);

  useEffect(() => {
    if (actionData?.success) {
      switch (actionData?.action) {
        case "updateStory":
        case "updateStoryType":
          setStories(prevStories => 
            prevStories?.map(story => 
              story.id === actionData?.story?.id ? actionData?.story : story
            )
          );
          setEditingStoryId(null);
          break;
        case "createStory":
          setStories(prevStories => [...prevStories, actionData?.story]);
          break;
      }
    }
  }, [actionData]);

  useEffect(() => {
    setStories(project?.userStories);
  }, [project?.userStories]);


  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const storyId = result.draggableId;
    const newType = result.destination.droppableId;


    // Optimistically update the UI
    setStories(prevStories =>
      prevStories?.map(story =>
        story.id === storyId ? { ...story, type: newType as "EPIC" | "FEATURE" | "STORY" } : story
      )
    );


    fetcher.submit(
      { storyId, newType, _action: "updateStoryType" },
      { method: "post" }
    );
  };
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{project?.name}</h1>
      {/* <BoardView stories={project.userStories} /> */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Edit Project</h2>
        <ProjectEditForm project={{
          id: project?.id ?? "",
          name: project?.name ?? "",
          description: project?.description ?? null,
          createdAt: project?.createdAt ? new Date(project?.createdAt ) : new Date(),
          updatedAt: project?.updatedAt ? new Date(project?.updatedAt) : new Date(),

        }} />
      </div>
      <BoardViewV2
        stories={stories ?? []}
        onDragEnd={handleDragEnd}
        onEditStory={(storyId) => setEditingStoryId(storyId)}
      />
       {editingStoryId && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Edit Story</h2>
          <StoryEditForm 
            story={stories?.find(s => s.id === editingStoryId)!}
          />
          <button
            onClick={() => setEditingStoryId(null)}
            className="mt-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel Edit
          </button>
        </div>
      )}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Add New Story</h2>
        <StoryForm />
        {actionData?.errors && (
          <div className="text-red-500 mt-2">
            {Object.values(actionData?.errors).join(", ")}
          </div>
        )}
      </div>
    </div>
  );
}