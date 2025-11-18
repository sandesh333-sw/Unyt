import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { notify } from "../components/Notification";

export default function CreateListing() {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("housing");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!api.isLoggedIn()) {
      notify.error("Please login to create a listing");
      navigate("/login");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !description) {
      notify.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    
    // Build listing data based on type
    const listingData = {
      type,
      title,
      description,
      images: images
    };

    // Add type-specific data
    if (type === "housing") {
      listingData.housing = {
        price: price ? parseFloat(price) : 0,
        location: location || "",
        bedrooms: 1,
        availableFrom: new Date(),
        duration: "6 months",
        amenities: []
      };
    } else if (type === "marketplace") {
      listingData.marketplace = {
        price: price ? parseFloat(price) : 0,
        condition: "good",
        category: "other"
      };
    } else if (type === "buddy") {
      listingData.buddy = {
        type: "shopping",
        date: new Date(),
        location: location || ""
      };
    }

    try {
      await api.createListing(listingData);
      notify.success("Listing created successfully!");
      setTimeout(() => navigate("/"), 1000);
    } catch (err) {
      notify.error(err.message || "Failed to create listing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow">
            <div className="card-body p-4">
              <h3 className="mb-4">Create New Listing</h3>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Listing Type</label>
                  <select 
                    className="form-select" 
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="housing">Housing</option>
                    <option value="marketplace">Marketplace</option>
                    <option value="buddy">Buddy</option>
                  </select>
                  <small className="text-muted">
                    {type === "housing" && "Find or offer accommodation"}
                    {type === "marketplace" && "Buy or sell items"}
                    {type === "buddy" && "Find a buddy for activities"}
                  </small>
                </div>

                <div className="mb-3">
                  <label className="form-label">Title *</label>
                  <input 
                    className="form-control"
                    placeholder="e.g., Cozy Room Near Campus"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Description *</label>
                  <textarea 
                    className="form-control"
                    rows="4"
                    placeholder="Describe your listing in detail..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                {(type === "housing" || type === "marketplace") && (
                  <div className="mb-3">
                    <label className="form-label">Price (£)</label>
                    <input 
                      type="number"
                      className="form-control"
                      placeholder="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                )}

                {(type === "housing" || type === "buddy") && (
                  <div className="mb-3">
                    <label className="form-label">Location</label>
                    <input 
                      className="form-control"
                      placeholder="e.g., Hatfield, AL10"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label">Images</label>
                  <input
                    type="file"
                    className="form-control"
                    multiple
                    accept="image/*"
                    onChange={(e) => setImages([...e.target.files])}
                  />
                  <small className="text-muted">
                    You can upload multiple images (max 5)
                  </small>
                </div>

                <div className="d-flex gap-2">
                  <button 
                    type="submit" 
                    className="btn btn-success"
                    disabled={loading}
                  >
                    {loading ? "Creating..." : "Create Listing"}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => navigate("/")}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
