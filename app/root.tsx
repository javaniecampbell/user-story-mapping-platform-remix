import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import "./tailwind.css";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { getUser } from "~/utils/auth.server";
import { ErrorBoundary } from "~/components/ErrorBoundary";

export const meta: MetaFunction = () => {
  return [
    { title: "User Story Mapping Platform" },
    { name: "description", content: "A platform for user story mapping" },
  ];
};



export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  return json({ user });
};

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="flex flex-col min-h-screen">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { user } = useLoaderData<typeof loader>();
  return (
    <>
      <Header user={{
        email: user?.email,
      }} />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export { ErrorBoundary };