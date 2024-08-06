// app/components/BoardView.tsx
import { useEffect, useState } from "react";
import { UserStory, Persona } from "@prisma/client";
import {
  Droppable,
  Draggable,
} from "react-beautiful-dnd";

interface BoardViewProps {
  stories: (UserStory & { personas: Persona[] })[];
  personas: Persona[];
  onEditStory: (storyId: string) => void;
  onDeleteStory: (storyId: string) => void;
}

export function BoardView({ stories, onEditStory, onDeleteStory }: BoardViewProps) {
  const columns = ["EPIC", "FEATURE", "STORY"];
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));

    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);

  // if (!enabled) {
  //   return null;
  // }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-max grid grid-cols-3 gap-4">
        {enabled && columns.map((column) => (
          <Droppable key={column} droppableId={column}>
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="bg-gray-100 p-4 rounded"
              >
                <h3 className="font-bold mb-2">{column}</h3>
                {stories
                  .filter((story) => story.type === column)
                  .map((story, index) => (
                    <Draggable
                      key={story.id}
                      draggableId={story.id}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="bg-white p-2 mb-2 rounded shadow group"
                        >
                          <div className="flex justify-between items-center">
                            <span>{story.title}</span>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => onEditStory(story.id)}
                                className="text-blue-500 mr-2"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => onDeleteStory(story.id)}
                                className="text-red-500"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          <Droppable droppableId={`story-${story.id}`} type="PERSONA">
                            {(provided) => (
                              <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="mt-2 min-h-[20px]"
                              >
                                {story.personas.map((persona, index) => (
                                  <Draggable key={persona.id} draggableId={persona.id} index={index}>
                                    {(provided) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className="bg-blue-100 text-xs p-1 mb-1 rounded"
                                      >
                                        {persona.name}
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </div>
                      )}
                    </Draggable>
                  ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </div>
  );
}
