import type { MetaFunction } from "@remix-run/node";
import { PanelContainer } from '~/components/PanelContainer';

export const meta: MetaFunction = () => {
  return [
    { title: "User Story Mapping Platform" },
    { name: "description", content: "A platform for user story mapping" },
  ];
};

export default function Index() {
  return (
    <div className="font-sans p-4">
      <h1 className="text-3xl">Welcome to Remix</h1>
      <PanelContainer>
        {/* Your 3-click task completion content goes here */}
        <h2>Quick Actions</h2>
        <button>Action 1</button>
        <button>Action 2</button>
        <button>Action 3</button>
      </PanelContainer>
    </div>
  );
}
