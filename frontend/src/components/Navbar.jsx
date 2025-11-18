import { Link } from "react-router-dom";
import api from "../services/api";

export default function Navbar() {
  const isLoggedIn = api.isLoggedIn();
  const user = api.getCurrentUser();

  const handleLogout = () => {
    api.logout();
  };

  return (
    <nav className="navbar navbar-expand-lg bg-light shadow-sm">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">Unyt</Link>

        <div className="ms-auto d-flex gap-2">
          <Link className="btn btn-outline-primary" to="/">
            Listings
          </Link>
          
          {isLoggedIn ? (
            <>
              <Link className="btn btn-outline-success" to="/create">
                Create Listing
              </Link>
              <Link className="btn btn-outline-info" to="/search">
                Search
              </Link>
              <span className="btn btn-outline-secondary disabled">
                {user?.firstName || user?.email}
              </span>
              <button className="btn btn-danger" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className="btn btn-outline-primary" to="/login">
                Login
              </Link>
              <Link className="btn btn-primary" to="/register">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
