import { Link } from "@remix-run/react";

export const Header = () => {
  return (
    <nav className="flex justify-center items-center">
      <Link to="/">
        <h1>
          <b>Journal</b>
        </h1>
      </Link>
    </nav>
  );
};
