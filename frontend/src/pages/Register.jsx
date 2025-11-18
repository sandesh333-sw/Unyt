import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { notify } from "../components/Notification";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!email || !password || !firstName || !lastName) {
      notify.error("Please fill in all fields");
      return;
    }
    
    if (password !== confirmPassword) {
      notify.error("Passwords do not match");
      return;
    }
    
    if (password.length < 6) {
      notify.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await api.register({ email, password, firstName, lastName });
      notify.success("Registration successful! Redirecting...");
      setTimeout(() => navigate("/"), 1000);
    } catch (err) {
      notify.error(err.message || "Registration failed");
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
              <h3 className="text-center mb-4">Register for Unyt</h3>
              
              <form onSubmit={handleRegister}>
                <div className="mb-3">
                  <label className="form-label">First Name</label>
                  <input 
                    className="form-control"
                    type="text" 
                    placeholder="John"
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)}
                    required 
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Last Name</label>
                  <input 
                    className="form-control"
                    type="text" 
                    placeholder="Doe"
                    value={lastName} 
                    onChange={(e) => setLastName(e.target.value)}
                    required 
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Email (University)</label>
                  <input 
                    className="form-control"
                    type="email" 
                    placeholder="your.email@herts.ac.uk"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                  <small className="text-muted">Must be a @herts.ac.uk email</small>
                </div>

                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input 
                    className="form-control"
                    type="password" 
                    placeholder="At least 6 characters"
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Confirm Password</label>
                  <input 
                    className="form-control"
                    type="password" 
                    placeholder="Re-enter password"
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required 
                  />
                </div>

                <button 
                  className="btn btn-primary w-100 mb-3" 
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Creating Account..." : "Register"}
                </button>
              </form>
              
              <div className="text-center">
                <p className="mb-0">Already have an account? 
                  <Link to="/login" className="text-decoration-none"> Login here</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

