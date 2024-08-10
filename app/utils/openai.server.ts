// app/utils/openai.server.ts
import OpenAI from 'openai';

const openAIApiKey = process.env.OPENAI_API_KEY;
if (!openAIApiKey) {
  throw new Error("OPENAI_API_KEY is not set");
}

const openai = new OpenAI({
  apiKey: openAIApiKey,
});

export async function generateStoryIdeas(prompt: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "You are a helpful assistant for generating user story ideas." },
      { role: "user", content: prompt }
    ],
    max_tokens: 150
  });

  return completion.choices[0].message.content || "No suggestions available.";
}

export async function refineUserStory(story: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "You are a helpful assistant for refining user stories." },
      { role: "user", content: `Refine this user story: ${story}` }
    ],
    max_tokens: 150
  });

  return completion.choices[0].message.content || "No refinement suggestions available.";
}

export async function generatePersonaTraits(prompt: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "You are a helpful assistant for generating persona traits and behaviors." },
      { role: "user", content: `Generate traits and behaviors for this persona: ${prompt}` }
    ],
    max_tokens: 200
  });

  return completion.choices[0].message.content || "No persona traits suggestions available.";
}

export async function generateJourneyNarrative(prompt: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "You are a helpful assistant for generating narrative descriptions of user journeys." },
      { role: "user", content: prompt }
    ],
    max_tokens: 300
  });

  return completion.choices[0].message.content || "No journey narrative available.";
}