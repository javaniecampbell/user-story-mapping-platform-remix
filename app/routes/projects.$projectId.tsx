// app/routes/projects.$projectId.tsx
import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, useFetcher, Form, Link } from "@remix-run/react";
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
import { getUserId, requireUserId } from "~/utils/auth.server";
import { generateStoryIdeas, refineUserStory } from "~/utils/openai.server";
import { PersonaManager } from "~/components/PersonaManager";


export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const project = await db.project.findUnique({
    where: {
      id: params.projectId, userId
    },
    include: {
      personas: true,
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
    where: { userId },
    select: { id: true, name: true },
  });

  return json({ project, personas });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const userId = await getUserId(request);
  const { projectId } = params;

  if (!projectId) {
    throw new Response("Not Found", { status: 404 });
  }
  const formData = await request.formData();
  const _action = formData.get("_action");

  switch (_action) {
    case "updateProject": {
      const name = formData.get("name");
      const description = formData.get("description");

      const nameError = validateRequired(name, "Project name");
      if (nameError) return handleErrors({ name: nameError });

      await db.project.update({
        where: { id: params.projectId, userId: userId! },
        data: {
          name: name as string,
          description: description as string,
        },
      });

      return json({ success: true, action: "updateProject" });
    }
    case "generateIdeas": {
      const prompt = formData.get("prompt");
      if (typeof prompt !== "string") {
        return json({ error: "Invalid prompt" }, { status: 400 });
      }
      const suggestion = await generateStoryIdeas(prompt);
      return json({ _action, suggestion });
    }
    case "refineStory": {
      const story = formData.get("story");
      if (typeof story !== "string") {
        return json({ error: "Invalid story" }, { status: 400 });
      }
      const suggestion = await refineUserStory(story);
      return json({ _action, suggestion });
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
          personas: {
            connect: personaIds.map(id => ({ id })),
          },
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
          personas: {
            connect: personaIds.map(id => ({ id })),
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

    case "createPersona": {
      const name = formData.get("name");
      const projectId = formData.get("projectId");

      if (typeof name !== "string" || typeof projectId !== "string") {
        return handleErrors({ name: "Invalid persona data" });
      }

      const persona = await db.persona.create({
        data: { name, projectIds: [projectId], userId: userId! },
      });

      return json({ success: true, persona });
    }
    case "deletePersona": {
      const personaId = formData.get("personaId");

      if (typeof personaId !== "string") {
        return handleErrors({ personaId: "Invalid persona ID" });
      }

      await db.persona.delete({ where: { id: personaId } });

      return json({ success: true, deletedPersonaId: personaId });
    }
    case "mapPersonaToStory": {
      const personaId = formData.get("personaId");
      const storyId = formData.get("storyId");

      if (typeof personaId !== "string" || typeof storyId !== "string") {
        return handleErrors({ mapping: "Invalid mapping data" });
      }

      await db.userStory.update({
        where: { id: storyId },
        data: {
          personas: {
            connect: { id: personaId }
          }
        }
      });

      return json({ success: true });
    }

    case "deleteProject": {
      await db.project.delete({
        where: { id: params.projectId, userId: userId! },
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


  const handleDeleteStory = (storyId: string) => {
    if (confirm("Are you sure you want to delete this story?")) {
      fetcher.submit(
        { storyId, _action: "deleteStory" },
        { method: "post" }
      );
    }
  };

  const handleStoryCreation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formaData = new FormData(e.currentTarget);
    formaData.append("_action", "createStory");
    fetcher.submit(formaData, { method: "post" })
  };

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

  const handlePersonaDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const personaId = result.draggableId;
    const storyId = result.destination.droppableId;

    fetcher.submit(
      { personaId, storyId, _action: "mapPersonaToStory" },
      { method: "post" }
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{project?.name}</h1>
        <Link
          to="journeys"
          className="inline-block mb-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Generate User Journey
        </Link>
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


      <div className="mt-8">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <BoardViewV2
              stories={stories ?? []}
              onDragEnd={handleDragEnd}
              onEditStory={(storyId) => setEditingStoryId(storyId)}
              onDeleteStory={handleDeleteStory}
            />
          </div>
          <div>
            <PersonaManager projectId={project.id} personas={project.personas} />
          </div>
        </div>
      </div>

      <div className="mt-8">
        {editingStoryId ? (
          <>
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
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-4">Add New Story</h2>
            <StoryForm onSubmit={handleStoryCreation} />
          </>
        )}
        {actionData?.errors && (
          <div className="text-red-500 mt-2">
            {Object.values(actionData?.errors).join(", ")}
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Edit Project</h2>
        <ProjectEditForm project={{
          id: project?.id ?? "",
          name: project?.name ?? "",
          description: project?.description ?? null,
          createdAt: project?.createdAt ? new Date(project?.createdAt) : new Date(),
          updatedAt: project?.updatedAt ? new Date(project?.updatedAt) : new Date(),

        }} />
      </div>
    </div>
  );
}