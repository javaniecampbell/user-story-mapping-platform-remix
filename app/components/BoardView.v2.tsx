// app/components/BoardView.tsx
import React from "react";
import { UserStory } from "@prisma/client";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";

interface BoardViewProps {
  stories: UserStory[];
  onDragEnd: (result: DropResult) => void;
  onEditStory: (storyId: string) => void;
}

export function BoardView({ stories, onDragEnd, onEditStory }: BoardViewProps) {
  const columns = ["EPIC", "FEATURE", "STORY"];

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="overflow-x-auto">
        <div className="min-w-max grid grid-cols-3 gap-4">
          {columns.map((column) => (
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
                              <button
                                onClick={() => onEditStory(story.id)}
                                className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                Edit
                              </button>
                            </div>
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
    </DragDropContext>
  );
}
