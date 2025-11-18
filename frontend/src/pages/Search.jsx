import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import ListingCard from "../components/ListingCard";
import { notify } from "../components/Notification";

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!api.isLoggedIn()) {
      notify.error("Please login to search listings");
      navigate("/login");
    }
  }, [navigate]);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) {
      notify.error("Please enter a search query");
      return;
    }

    setLoading(true);
    setSearched(true);
    
    try {
      const res = await api.request("/listings/search", {
        method: "POST",
        body: JSON.stringify({ q: query })
      });
      setResults(res.results || []);
      
      if (res.results?.length === 0) {
        notify.info("No results found");
      }
    } catch (err) {
      notify.error(err.message || "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="row justify-content-center mb-4">
        <div className="col-md-8">
          <h2 className="text-center mb-4">Search Listings</h2>
          
          <form onSubmit={handleSearch}>
            <div className="input-group input-group-lg">
              <input 
                className="form-control"
                placeholder="Search for housing, items, buddies..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button 
                className="btn btn-primary px-4" 
                type="submit"
                disabled={loading}
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Searching...</span>
          </div>
        </div>
      ) : searched ? (
        results.length === 0 ? (
          <div className="alert alert-info text-center">
            <h4>No results found for "{query}"</h4>
            <p>Try a different search term</p>
          </div>
        ) : (
          <>
            <h5 className="mb-3">Found {results.length} result(s)</h5>
            <div className="row">
              {results.map((listing) => (
                <div className="col-md-4 col-lg-3 mb-4" key={listing._id}>
                  <ListingCard listing={listing} />
                </div>
              ))}
            </div>
          </>
        )
      ) : (
        <div className="text-center text-muted py-5">
          <h5>Start searching to find listings</h5>
          <p>Enter keywords like "room", "laptop", "airport buddy", etc.</p>
        </div>
      )}
    </div>
  );
}
