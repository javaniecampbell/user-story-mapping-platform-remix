// app/components/Header.tsx
import { Link } from "@remix-run/react";

export function Header() {
  return (
    <header className="bg-blue-600 text-white p-4">
      <nav className="container mx-auto flex justify-between">
        <Link to="/" className="text-2xl font-bold">
          User Story Mapping
        </Link>
        <ul className="flex space-x-4">
          <li><Link to="/projects">Projects</Link></li>
          <li><Link to="/about">About</Link></li>
        </ul>
      </nav>
    </header>
  );
}
