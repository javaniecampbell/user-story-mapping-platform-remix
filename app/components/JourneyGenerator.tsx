// app/components/JourneyGenerator.tsx
import React, { useState } from 'react';
import { useFetcher } from '@remix-run/react';
import { UserStory, Persona } from '@prisma/client';

interface JourneyGeneratorProps {
  projectId: string;
  stories: UserStory[];
  personas: Persona[];
}

export function JourneyGenerator({ projectId, stories, personas }: JourneyGeneratorProps) {
  const [selectedPersona, setSelectedPersona] = useState<string>('');
  const [selectedStories, setSelectedStories] = useState<string[]>([]);
  const fetcher = useFetcher();

  const handlePersonaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPersona(e.target.value);
  };

  const handleStoryToggle = (storyId: string) => {
    setSelectedStories(prev => 
      prev.includes(storyId)
        ? prev.filter(id => id !== storyId)
        : [...prev, storyId]
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('_action', 'generateJourney');
    formData.append('projectId', projectId);
    formData.append('personaId', selectedPersona);
    selectedStories.forEach(storyId => formData.append('storyIds', storyId));
    
    fetcher.submit(formData, { method: 'post' });
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Generate User Journey</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="journeyName" className="block text-sm font-medium text-gray-700">Journey Name</label>
          <input
            type="text"
            id="journeyName"
            name="name"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="persona" className="block text-sm font-medium text-gray-700">Select Persona</label>
          <select
            id="persona"
            value={selectedPersona}
            onChange={handlePersonaChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">Select a persona</option>
            {personas.map(persona => (
              <option key={persona.id} value={persona.id}>{persona.name}</option>
            ))}
          </select>
        </div>
        <div>
          <span className="block text-sm font-medium text-gray-700">Select User Stories</span>
          <div className="mt-1 space-y-2">
            {stories.map(story => (
              <div key={story.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`story-${story.id}`}
                  checked={selectedStories.includes(story.id)}
                  onChange={() => handleStoryToggle(story.id)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor={`story-${story.id}`} className="ml-2 text-sm text-gray-900">
                  {story.title}
                </label>
              </div>
            ))}
          </div>
        </div>
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Generate Journey
        </button>
      </form>
      {fetcher.data?.journey && (
        <div className="mt-4 p-4 bg-gray-100 rounded-md">
          <h3 className="font-semibold">Generated Journey:</h3>
          <p>{fetcher.data?.journey?.name}</p>
          <ul className="list-disc pl-5 mt-2">
            {fetcher.data?.journey?.steps?.map((step: any, index: number) => (
              <li key={index}>{step?.description}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}