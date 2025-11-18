import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import ListingCard from "../components/ListingCard";
import { notify } from "../components/Notification";

export default function Listings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    // Check if logged in
    if (!api.isLoggedIn()) {
      navigate("/login");
      return;
    }
    loadListings();
  }, [navigate]);

  const loadListings = async () => {
    setLoading(true);
    try {
      const params = filter !== "all" ? { type: filter, limit: 50 } : { limit: 50 };
      const data = await api.getListings(params);
      setListings(data.listings || []);
    } catch (err) {
      notify.error(err.message || "Failed to load listings");
      if (err.message?.includes("authorized")) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (api.isLoggedIn()) {
      loadListings();
    }
  }, [filter]);

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>All Listings</h2>
        <div className="btn-group">
          <button 
            className={`btn ${filter === "all" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button 
            className={`btn ${filter === "housing" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setFilter("housing")}
          >
            Housing
          </button>
          <button 
            className={`btn ${filter === "marketplace" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setFilter("marketplace")}
          >
            Marketplace
          </button>
          <button 
            className={`btn ${filter === "buddy" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setFilter("buddy")}
          >
            Buddy
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : listings.length === 0 ? (
        <div className="alert alert-info text-center">
          <h4>No listings found</h4>
          <p>Be the first to create a listing!</p>
        </div>
      ) : (
        <div className="row">
          {listings.map((listing) => (
            <div key={listing._id} className="col-md-4 col-lg-3 mb-4">
              <ListingCard listing={listing} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
