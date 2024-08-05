// app/routes/dashboard.tsx
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { db } from "~/utils/db.server";

export const loader = async () => {
  const projects = await db.project.findMany({
    select: {
      id: true,
      name: true,
      _count: {
        select: { userStories: true }
      },
      userStories: {
        select: { type: true }
      }
    },
    orderBy: { updatedAt: 'desc' },
    take: 5 // Limit to 5 most recently updated projects
  });

  const projectSummaries = projects.map(project => ({
    id: project.id,
    name: project.name,
    totalStories: project._count.userStories,
    epicCount: project.userStories.filter(story => story.type === 'EPIC').length,
    featureCount: project.userStories.filter(story => story.type === 'FEATURE').length,
    storyCount: project.userStories.filter(story => story.type === 'STORY').length,
  }));

  const totalProjects = await db.project.count();
  const totalStories = await db.userStory.count();

  return json({
    projectSummaries,
    totalProjects,
    totalStories,
  });
};

export default function Dashboard() {
  const { projectSummaries, totalProjects, totalStories } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-100 p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Total Projects</h2>
          <p className="text-4xl font-bold">{totalProjects}</p>
        </div>
        <div className="bg-green-100 p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Total User Stories</h2>
          <p className="text-4xl font-bold">{totalStories}</p>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Recent Projects</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 text-left">Project Name</th>
                <th className="py-2 px-4 text-left">Total Stories</th>
                <th className="py-2 px-4 text-left">Epics</th>
                <th className="py-2 px-4 text-left">Features</th>
                <th className="py-2 px-4 text-left">Stories</th>
                <th className="py-2 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projectSummaries.map((project) => (
                <tr key={project.id} className="border-b">
                  <td className="py-2 px-4">{project.name}</td>
                  <td className="py-2 px-4">{project.totalStories}</td>
                  <td className="py-2 px-4">{project.epicCount}</td>
                  <td className="py-2 px-4">{project.featureCount}</td>
                  <td className="py-2 px-4">{project.storyCount}</td>
                  <td className="py-2 px-4">
                    <Link to={`/projects/${project.id}`} className="text-blue-500 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <Link to="/projects" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          View All Projects
        </Link>
      </div>
    </div>
  );
}