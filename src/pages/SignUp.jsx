import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config";
import "./SignUp.css";

const CITIES_API = "https://data.gov.il/api/3/action/datastore_search?resource_id=5c78e9fa-c2e2-4771-93ff-7f400a12f7ba&limit=2000";

function SignUp() {
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [citySearch, setCitySearch] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    dateOfBirth: { day: "", month: "", year: "" },
    city: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(CITIES_API);
        if (!res.ok) return;
        const data = await res.json();
        const names = data.result.records
          .map(r => r["שם_ישוב_לועזי"]?.trim())
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b, "en"));
        setCities([...new Set(names)]);
      } catch (err) {
        console.error("Failed to load cities:", err);
      }
    })();
  }, []);

  const filteredCities = citySearch
    ? cities.filter(c => c.toLowerCase().includes(citySearch.toLowerCase()))
    : cities;

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (["day", "month", "year"].includes(name)) {
      setFormData({
        ...formData,
        dateOfBirth: { ...formData.dateOfBirth, [name]: value },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    const nameRegex = /^[A-Za-z]{3,}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    if (!nameRegex.test(formData.firstName)) {
      alert("First name must be at least 3 letters and contain only letters.");
      return;
    }
    if (!nameRegex.test(formData.lastName)) {
      alert("Last name must be at least 3 letters and contain only letters.");
      return;
    }
    if (!emailRegex.test(formData.email)) {
      alert("Please enter a valid email.");
      return;
    }
    if (!passwordRegex.test(formData.password)) {
      alert("Password must be at least 8 characters long, contain one uppercase letter, one lowercase letter, and one number.");
      return;
    }
    if (!formData.city) {
      alert("Please select a city.");
      return;
    }

    const formattedDate = `${formData.dateOfBirth.day}-${formData.dateOfBirth.month}-${formData.dateOfBirth.year}`;

    try {
      const response = await fetch(`${API_BASE}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          dateOfBirth: formattedDate,
          city: formData.city,
        }),
      });

      if (response.ok) {
        navigate("/Login")
      } else {
        const error = await response.json();
        alert("Error: " + error.message);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div className="signup-container">
      <h2 className="signup-title">Sign Up</h2>
      <form onSubmit={handleSubmit} className="signup-form">
        <label className="form-label">
          First Name:
          <input type="text" name="firstName" className="form-input" value={formData.firstName} onChange={handleInputChange} required />
        </label>
        <label className="form-label">
          Last Name:
          <input type="text" name="lastName" className="form-input" value={formData.lastName} onChange={handleInputChange} required />
        </label>
        <label className="form-label">
          Email:
          <input type="email" name="email" className="form-input" value={formData.email} onChange={handleInputChange} required />
        </label>
        <label className="form-label">
          Password:
          <input type="password" name="password" className="form-input" value={formData.password} onChange={handleInputChange} required />
        </label>
        <label className="form-label">
          Birth Date:
          <div className="date-select">
            <select name="day" className="date-input" value={formData.dateOfBirth.day} onChange={handleInputChange} required>
              <option value="" disabled>Day</option>
              {Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
            </select>
            <select name="month" className="date-input" value={formData.dateOfBirth.month} onChange={handleInputChange} required>
              <option value="" disabled>Month</option>
              {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
            </select>
            <select name="year" className="date-input" value={formData.dateOfBirth.year} onChange={handleInputChange} required>
              <option value="" disabled>Year</option>
              {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(year => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>
        </label>
        <label className="form-label">
          City:
          <input
            type="text"
            className="form-input"
            placeholder="Search city..."
            value={citySearch}
            onChange={e => setCitySearch(e.target.value)}
          />
          <select name="city" className="form-input" value={formData.city} onChange={handleInputChange} required>
            <option value="" disabled>Select your city</option>
            {filteredCities.map(city => <option key={city} value={city}>{city}</option>)}
          </select>
        </label>
        <button type="submit" className="form-button">Sign Up</button>
      </form>
    </div>
  );
}

export default SignUp;