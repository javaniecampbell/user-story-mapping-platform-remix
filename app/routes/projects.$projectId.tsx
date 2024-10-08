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
import { getUserId, requireUserId } from "~/utils/auth.server";
import { generateStoryIdeas, refineUserStory } from "~/utils/openai.server";
import { PersonaManager } from "~/components/PersonaManager";
import { JourneyGenerator } from "~/components/JourneyGenerator";
import type { DropResult } from 'react-beautiful-dnd';
import { DragAndDropProvider } from "~/components/DragAndDropProvider";

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

    case "removePersonaFromStory": {
      const personaId = formData.get("personaId");
      const storyId = formData.get("storyId");

      if (typeof personaId !== "string" || typeof storyId !== "string") {
        return handleErrors({ mapping: "Invalid mapping data" });
      }

      await db.userStory.update({
        where: { id: storyId },
        data: {
          personas: {
            disconnect: { id: personaId }
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
  const { project, personas: initialPersonas } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const fetcher = useFetcher();
  const [stories, setStories] = useState(project?.userStories);
  const [personas, setPersonas] = useState([...project?.personas, ...initialPersonas]);
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
    console.log("LOADED USER STORIES", project?.userStories)

  }, [project?.userStories]);

  useEffect(() => {
    if (fetcher.data?.success) {
      if (fetcher.data?.story) {
        setStories(prevStories => [...prevStories, fetcher.data?.story]);
        console.log("FETCHED STORY", fetcher.data?.story)
      }
      if (fetcher.data?.persona) {
        setPersonas(prevPersonas => [...prevPersonas, fetcher.data?.persona]);
        console.log("FETCHED PERSONA", fetcher.data?.persona)
      }
      if (fetcher.data?.deletedPersonaId) {
        setPersonas(prevPersonas => prevPersonas?.filter(p => p.id !== fetcher.data?.deletedPersonaId));
        console.log("DELETED PERSONA", fetcher.data?.deletedPersonaId)
      }
    }
  }, [fetcher.data]);

  const handleDeleteStory = (storyId: string) => {
    if (confirm("Are you sure you want to delete this story?")) {
      fetcher.submit(
        { storyId, _action: "deleteStory" },
        { method: "post" }
      );
    }
  };

  const handleCreateStory = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formaData = new FormData(e.currentTarget);
    formaData.append("_action", "createStory");
    fetcher.submit(formaData, { method: "post" })
  };
  const handlePersonaManagerToStoryDragEnd = (result: DropResult, options?: { personaId: string, destinationId: string }) => {
    if (!result.destination) return;
    const { personaId, destinationId } = options ?? {};
    if (!personaId || !destinationId) {
      return;
    }
    const storyId = destinationId.replace("story-", "");

    fetcher.submit(
      { _action: "mapPersonaToStory", storyId, personaId },
      { method: "post" }
    );

    // Optimistically update the UI
    setStories(prevStories =>
      prevStories?.map(story =>
        story.id === storyId
          ? { ...story, personas: [...story.personas, personas.find(p => p.id === personaId)!] }
          : story
      )
    );
  };
  const handleStoryToPersonaManagerDragEnd = (result: DropResult, options?: { personaId: string, sourceId: string, destinationId: string }) => {
    if (!result.destination) return;
    const { personaId, sourceId, destinationId } = options ?? {};
    if (!personaId || !sourceId || !destinationId) {
      return;
    }

    const sourceStoryId = sourceId.replace("story-", "");

    fetcher.submit(
      { _action: "removePersonaFromStory", storyId: sourceStoryId, personaId },
      { method: "post" }
    );

    // Optimistically update the UI
    setStories(prevStories =>
      prevStories.map(story =>
        story.id === sourceStoryId
          ? { ...story, personas: story.personas.filter(p => p.id !== personaId) }
          : story
      )
    );
  };
  const handleStoryDragEnd = (result: DropResult) => {
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
  const handlePersonaDragEnd = (result: DropResult, options?: { sourceStoryId: string, destinationStoryId: string, personaId: string }) => {
    if (!result.destination) return;

    const { sourceStoryId, destinationStoryId, personaId } = options ?? {};

    if (!sourceStoryId || !destinationStoryId || !personaId) {
      return;
    }

    if (sourceStoryId === destinationStoryId) {
      // Reordering within the same story, no backend update needed
      return;
    }

    // if (result.source.droppableId.startsWith("story-")) {
    //   // Moving from one story to another
    //   fetcher.submit(
    //     { _action: "removePersonaFromStory", storyId: result.source.droppableId.replace("story-", ""), personaId },
    //     { method: "post" }
    //   );
    // }

    // fetcher.submit(
    //   { _action: "mapPersonaToStory", storyId, personaId },
    //   { method: "post" }
    // );

    fetcher.submit(
      { _action: "removePersonaFromStory", storyId: sourceStoryId, personaId },
      { method: "post" }
    );

    fetcher.submit(
      { _action: "mapPersonaToStory", storyId: destinationStoryId, personaId },
      { method: "post" }
    );

    // Optimistically update the UI
    setStories(prevStories =>
      prevStories?.map(story => {
        if (story.id === destinationStoryId) {
          return {
            ...story,
            personas: [...story.personas, personas.find(p => p.id === personaId)!]
          };
        }
        if (story.id === sourceStoryId) {
          return {
            ...story,
            personas: story.personas.filter(p => p.id !== personaId)
          };
        }
        return story;
      })
    );
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.type === "PERSONA") {
      const personaId = result.draggableId;
      const sourceId = result.source.droppableId;
      const destinationId = result.destination.droppableId;

      const sourceStoryId = sourceId.replace("story-", "");
      if (sourceId === "persona-manager") {
        // Dragging from PersonaManager to a story
        handlePersonaManagerToStoryDragEnd(result, { personaId, destinationId });

      } else if (destinationId === "persona-manager") {
        // Dragging from a story back to PersonaManager
        handleStoryToPersonaManagerDragEnd(result, { personaId, sourceId, destinationId });

      } else {
        // Moving between stories
        const sourceStoryId = sourceId.replace("story-", "");
        const destinationStoryId = destinationId.replace("story-", "");
        handlePersonaDragEnd(result, { sourceStoryId, destinationStoryId, personaId });
      }
    } else {
      // Handle story type changes 
      handleStoryDragEnd(result);
    }
  };

  console.log("PROJECT DETAILS", project)
  return (
    <div className="space-y-8">
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

      <DragAndDropProvider onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <BoardViewV2
              stories={stories ?? []}
              onEditStory={(storyId) => setEditingStoryId(storyId)}
              onDeleteStory={handleDeleteStory}
            />
          </div>
          <div>
            <PersonaManager projectId={project.id} personas={personas} />
          </div>
        </div>
      </DragAndDropProvider>

      <div>
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
            <StoryForm onSubmit={handleCreateStory} />
          </>
        )}
        {actionData?.errors && (
          <div className="text-red-500 mt-2">
            {Object.values(actionData?.errors).join(", ")}
          </div>
        )}
      </div>
      <div>
        <JourneyGenerator projectId={project?.id} stories={stories} personas={personas} />
      </div>
      <div>
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