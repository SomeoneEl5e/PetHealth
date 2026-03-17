import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import './Login.css'

function Login({ setIsLoggedIn }) {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        const { token, user: { id, firstName, role } } = data;
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("userId", id);
        sessionStorage.setItem("firstName", firstName);
        sessionStorage.setItem("role", role || "user");
        setIsLoggedIn(true);
        navigate("/"); // Redirect to home page
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      console.error("Error during login:", error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Login</h2>
      <form onSubmit={handleSubmit}>
        <label className="login-label">Email:</label>
        <input
          type="email"
          name="email"
          className="login-input"
          value={formData.email}
          onChange={handleInputChange}
          required
        />

        <label className="login-label">Password:</label>
        <input
          type="password"
          name="password"
          className="login-input"
          value={formData.password}
          onChange={handleInputChange}
          required
        />

        <button type="submit" className="login-button">Login</button>
      </form>
    </div>
  );
}

export default Login;