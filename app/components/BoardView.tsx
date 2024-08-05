// app/components/BoardView.tsx
import React from 'react';
import { UserStory } from '@prisma/client';

interface BoardViewProps {
  stories: UserStory[];
}

export function BoardView({ stories }: BoardViewProps) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-max grid grid-cols-3 gap-4">
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-bold mb-2">Epics</h3>
          {stories
            .filter(story => story.type === 'EPIC')
            .map(story => (
              <div key={story.id} className="bg-white p-2 mb-2 rounded shadow">
                {story.title}
              </div>
            ))}
        </div>
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-bold mb-2">Features</h3>
          {stories
            .filter(story => story.type === 'FEATURE')
            .map(story => (
              <div key={story.id} className="bg-white p-2 mb-2 rounded shadow">
                {story.title}
              </div>
            ))}
        </div>
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-bold mb-2">User Stories</h3>
          {stories
            .filter(story => story.type === 'STORY')
            .map(story => (
              <div key={story.id} className="bg-white p-2 mb-2 rounded shadow">
                {story.title}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}