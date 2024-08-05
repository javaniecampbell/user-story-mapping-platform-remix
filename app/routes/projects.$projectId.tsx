// app/routes/projects.$projectId.tsx
import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, useFetcher, Form } from "@remix-run/react";
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
import { requireUserId } from "~/utils/auth.server";


export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  // const userId = await requireUserId(request);
  const project = await db.project.findUnique({
    where: {
      id: params.projectId

      //,userId
    },
    include: {
      userStories: {
        include: {
          personas: true
        },
      }
    },
  });

  if (!project) {
    throwNotFoundError("Project not found");
  }

  const personas = await db.persona.findMany({
    // where: { userId },
    select: { id: true, name: true },
  });

  return json({ project, personas });
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
    case "createStory": {
      // Handle story creation (existing code)
      const title = formData.get("title");
      const description = formData.get("description");
      const type = formData.get("type");
      const personaIds = formData.getAll("personaIds") as string[];

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
          personas:{
            connect: personaIds.map(id => ({id})),
          }
        },
      });

      return json({ success: true, action: "createStory", story: story });
    }
    case "updateStory": {
      const storyId = formData.get("storyId");
      const title = formData.get("title");
      const description = formData.get("description");
      const type = formData.get("type");
      const personaIds = formData.getAll("personaIds") as string[];

      const titleError = validateRequired(title, "Title");
      const typeError = validateType(type, "Type", "string");

      if (titleError || typeError) {
        return handleErrors({ title: titleError!, type: typeError! });
      }

      const updatedStory = await db.userStory.update({
        where: { id: storyId as string },
        data: {
          title: title as string,
          description: description as string,
          type: type as "EPIC" | "FEATURE" | "STORY",
          projectId: params.projectId!,
          personas:{
            connect: personaIds.map(id => ({id})),
          }
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

    case "deleteProject": {
      await db.project.delete({
        where: { id: params.projectId },
      });
      return redirect("/projects");
    }

    case "deleteStory": {
      const storyId = formData.get("storyId");
      if (typeof storyId !== "string") {
        return json({ error: "Invalid story ID" }, { status: 400 });
      }
      await db.userStory.delete({
        where: { id: storyId },
      });
      return json({ success: true, action: "deleteStory", storyId });
    }

    default: 
      return json({ error: "Invalid action" }, { status: 400 });
  }
};

export default function ProjectDetail() {
  const { project } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const fetcher = useFetcher();
  const [stories, setStories] = useState(project?.userStories);
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);

  const handleDeleteStory = (storyId: string) => {
    if (confirm("Are you sure you want to delete this story?")) {
      fetcher.submit(
        { storyId, _action: "deleteStory" },
        { method: "post" }
      );
    }
  };


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
        case "deleteStory":
          setStories(prevStories => prevStories?.filter(story => story.id !== actionData?.storyId));
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
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{project?.name}</h1>
        <Form method="post">
          <input type="hidden" name="_action" value="deleteProject" />
          <button
            type="submit"
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            onClick={(e) => {
              if (!confirm("Are you sure you want to delete this project?")) {
                e.preventDefault();
              }
            }}
          >
            Delete Project
          </button>
        </Form>
      </div>
      {/* <BoardView stories={project.userStories} /> */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Edit Project</h2>
        <ProjectEditForm project={{
          id: project?.id ?? "",
          name: project?.name ?? "",
          description: project?.description ?? null,
          createdAt: project?.createdAt ? new Date(project?.createdAt) : new Date(),
          updatedAt: project?.updatedAt ? new Date(project?.updatedAt) : new Date(),

        }} />
      </div>
      <BoardViewV2
        stories={stories ?? []}
        onDragEnd={handleDragEnd}
        onEditStory={(storyId) => setEditingStoryId(storyId)}
        onDeleteStory={handleDeleteStory}
      />
      {editingStoryId && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Edit Story</h2>
          <StoryEditForm
            story={stories?.find(s => s.id === editingStoryId)! ?? {
              id: "",
              title: "",
              description: null,
              type: "EPIC",
              personaIds: [],
            }}
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