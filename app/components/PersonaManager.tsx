// app/components/PersonaManager.tsx
import React, { useState } from 'react';
import { useFetcher } from '@remix-run/react';
import { Persona } from '@prisma/client';
import { Droppable, Draggable } from 'react-beautiful-dnd';

interface PersonaManagerProps {
  projectId: string;
  personas: Persona[];
}

export function PersonaManager({ projectId, personas: initialPersonas }: PersonaManagerProps) {
  const [personas, setPersonas] = useState(initialPersonas);
  const fetcher = useFetcher();

  const handleCreatePersona = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.append('_action', 'createPersona');
    formData.append('projectId', projectId);

    fetcher.submit(formData, { method: 'post' });
  };

  const handleDeletePersona = (personaId: string) => {
    if (confirm('Are you sure you want to delete this persona?')) {
      fetcher.submit(
        { _action: 'deletePersona', personaId },
        { method: 'post' }
      );
    }
  };

  React.useEffect(() => {
    if (fetcher.data?.persona) {
      setPersonas([...personas, fetcher.data?.persona]);
    } else if (fetcher.data?.deletedPersonaId) {
      setPersonas(personas.filter(p => p.id !== fetcher.data?.deletedPersonaId));
    }
  }, [fetcher.data]);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Personas</h2>
      <Droppable droppableId='persona-manager' type='PERSONA'>
        {(provided) => (
          <ul
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-2"
          >
            {personas.map((persona, index) => (
              <Draggable key={persona.id} draggableId={persona.id} index={index}>
                {(provided) => (
                  <li
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    key={persona.id}
                    className="flex items-center justify-between bg-white p-2 rounded shadow">
                    <span>{persona.name}</span>
                    <button
                      onClick={() => handleDeletePersona(persona.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </li>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </ul>
        )}
      </Droppable>
      <form onSubmit={handleCreatePersona} className="mt-4">
        <input
          type="text"
          name="name"
          placeholder="New persona name"
          required
          className="border rounded px-2 py-1 mr-2"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
        >
          Add Persona
        </button>
      </form>
    </div>
  );
}