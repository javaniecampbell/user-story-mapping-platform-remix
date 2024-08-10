// app/routes/api.llm-suggestions.tsx
import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { generateStoryIdeas, refineUserStory, generatePersonaTraits, generateJourneyNarrative } from "~/utils/openai.server";

export const action = async ({ request }: ActionFunctionArgs) => {
    const formData = await request.formData();
    const action = formData.get("_action");
    const prompt = formData.get("prompt");

    if (typeof prompt !== "string") {
        return json({ error: "Invalid prompt" }, { status: 400 });
    }

    try {
        let suggestion;
        switch (action) {
            case "generateIdeas":
                suggestion = await generateStoryIdeas(prompt);
                break;
            case "refineStory":
                suggestion = await refineUserStory(prompt);
                break;
            case "generatePersonaTraits":
                suggestion = await generatePersonaTraits(prompt);
                break;
            case "generateJourneyNarrative":
                suggestion = await generateJourneyNarrative(prompt);
                break;
            default:
                return json({ error: "Invalid action" }, { status: 400 });
        }

        return json({ suggestion });
    } catch (error) {
        console.error("Error calling OpenAI:", error);
        return json({ error: "Failed to generate suggestion" }, { status: 500 });
    }
};