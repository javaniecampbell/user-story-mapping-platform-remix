// app/routes/projects.$projectId.tsx
import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, useFetcher } from "@remix-run/react";
import { useState, useEffect } from 'react';
import { BoardView } from "~/components/BoardView";
import { BoardView as BoardViewV2 } from "~/components/BoardView.v2";
import { StoryForm } from "~/components/StoryForm";
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

  if (_action === "updateStoryType") {
    const storyId = formData.get("storyId");
    const newType = formData.get("newType");

    const storyIdError = validateRequired(storyId, "Story ID");
    const newTypeError = validateType(newType, "New Type", "string");

    if (storyIdError !== null || newTypeError !== null) {
      return handleErrors({ storyId: storyIdError!, newType: newTypeError! });
    }

    await db.userStory.update({
      where: { id: storyId as string },
      data: { type: newType as "EPIC" | "FEATURE" | "STORY" },
    });

    return json({ success: true });
  }
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

  return redirect(`/projects/${params.projectId}`);
};

export default function ProjectDetail() {
  const { project } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const fetcher = useFetcher();
  const [stories, setStories] = useState(project?.userStories);

  // useEffect(() => {
  //   if (actionData?.success) {
  //     setStories(prevStories => [...prevStories, actionData.story]);
  //   }
    
  // }, [actionData]);

  useEffect(() => {
    setStories(project?.userStories);
  }, [project?.userStories]);


  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const storyId = result.draggableId;
    const newType = result.destination.droppableId;


    // Optimistically update the UI
    setStories(prevStories => 
      prevStories.map(story => 
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
      <BoardViewV2 stories={project?.userStories ?? []} onDragEnd={handleDragEnd} />
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