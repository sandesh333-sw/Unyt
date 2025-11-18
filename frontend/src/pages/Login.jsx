import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { notify } from "../components/Notification";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      notify.error("Please fill in all fields");
      return;
    }
    
    setLoading(true);
    try {
      await api.login(email, password);
      notify.success("Logged in successfully!");
      setTimeout(() => navigate("/"), 500);
    } catch (err) {
      notify.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="card shadow">
            <div className="card-body p-4">
              <h3 className="text-center mb-4">Login to Unyt</h3>
              
              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input 
                    className="form-control"
                    type="email" 
                    placeholder="your.email@herts.ac.uk"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input 
                    className="form-control"
                    type="password" 
                    placeholder="Enter your password"
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button 
                  className="btn btn-primary w-100 mb-3" 
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
              </form>
              
              <div className="text-center">
                <p className="mb-0">Don't have an account? 
                  <Link to="/register" className="text-decoration-none"> Register here</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
