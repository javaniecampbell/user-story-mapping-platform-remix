// app/components/Header.tsx
import { Link, Form } from "@remix-run/react";
type HeaderProps = {
  user?: {
    email?: string;
  }
}
export function Header({ user }: HeaderProps) {
  return (
    <header className="bg-blue-600 text-white p-4">
      <nav className="container mx-auto flex justify-between">
        <Link to="/" className="text-2xl font-bold">
          Story Mapper
        </Link>
        <ul className="flex space-x-4">
          <li><Link to="/dashboard">Dashboard</Link></li>
          <li><Link to="/projects">Projects</Link></li>
          <li><Link to="/about">About</Link></li>
          {user && user?.email ? (
            <>
              <li>Welcome, {user?.email}</li>
              <li>
                <Form action="/logout" method="post">
                  <button type="submit" className="underline">Logout</button>
                </Form>
              </li>
            </>
          ) : (
            <>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/signup">Sign Up</Link></li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
}
