// app/components/PersonaForm.tsx
import { Form, useFetcher } from "@remix-run/react";
import { useState } from "react";

interface PersonaFormProps {
    onSubmit: (data: FormData) => void;
}

export function PersonaForm({ onSubmit }: PersonaFormProps) {
    const [name, setName] = useState("");
    const [traits, setTraits] = useState("");
    const fetcher = useFetcher();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        onSubmit(formData);
        event.currentTarget.reset();
        setName("");
        setTraits("");
    };

    const handleGenerateTraits = () => {
        fetcher.submit(
            { _action: "generatePersonaTraits", prompt: name },
            { method: "post" }
        );
    };

    return (
        <Form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Persona Name
                </label>
                <input
                    type="text"
                    name="name"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
            </div>
            <div>
                <label htmlFor="traits" className="block text-sm font-medium text-gray-700">
                    Traits and Behaviors
                </label>
                <div className="mt-1">
                    <textarea
                        name="traits"
                        id="traits"
                        value={traits}
                        onChange={(e) => setTraits(e.target.value)}
                        rows={3}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    ></textarea>
                </div>
                <button
                    type="button"
                    onClick={handleGenerateTraits}
                    className="mt-2 inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                    Generate Traits
                </button>
            </div>
            <button
                type="submit"
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
                Create Persona
            </button>

            <>
                {fetcher.data && (
                    <div className="mt-4 p-4 bg-gray-100 rounded-md">
                        <h3 className="font-semibold">AI Suggestion:</h3>
                        <p>{fetcher.data?.suggestion}</p>
                        <button
                            type="button"
                            onClick={() => {
                                setTraits(fetcher.data?.suggestion);
                            }}
                            className="mt-2 inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Use Suggestion
                        </button>
                    </div>
                )}
            </>
        </Form>
    );
}