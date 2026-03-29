/**
 * Edit Profile Page
 * -----------------
 * Allows authenticated users to update their personal information.
 *
 * Editable fields:
 * - First name, last name, email
 * - Birth date (day/month/year dropdowns)
 * - City (search + select from Israeli Government API)
 * - Password change (requires current password verification)
 *
 * Client-side validation mirrors the signup form rules.
 * On success: updates sessionStorage firstName and redirects to /profile.
 */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config";
import "./EditProfile.css";

const API = `${API_BASE}/api/me`;

const CITIES_API = "https://data.gov.il/api/3/action/datastore_search?resource_id=5c78e9fa-c2e2-4771-93ff-7f400a12f7ba&limit=2000";

function authHeaders() {
  return {
    Authorization: `Bearer ${sessionStorage.getItem("token")}`,
    "Content-Type": "application/json",
  };
}

export default function EditProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState([]);
  const [citySearch, setCitySearch] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    dateOfBirth: { day: "", month: "", year: "" },
    city: "",
    currentPassword: "",
    newPassword: "",
  });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch(API, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      let dob = { day: "", month: "", year: "" };
      if (data.dateOfBirth) {
        const parts = data.dateOfBirth.split("-");
        if (parts.length === 3) dob = { day: parts[0], month: parts[1], year: parts[2] };
      }
      setForm((f) => ({ ...f, firstName: data.firstName, lastName: data.lastName, email: data.email, dateOfBirth: dob, city: data.city || "" }));
      setLoading(false);
    })();
  }, []);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (["day", "month", "year"].includes(name)) {
      setForm((f) => ({ ...f, dateOfBirth: { ...f.dateOfBirth, [name]: value } }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    const nameRegex = /^[A-Za-z]{3,}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!nameRegex.test(form.firstName)) return setMsg("First name must be at least 3 letters and contain only letters.");
    if (!nameRegex.test(form.lastName)) return setMsg("Last name must be at least 3 letters and contain only letters.");
    if (!emailRegex.test(form.email)) return setMsg("Please enter a valid email.");

    if (form.newPassword) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      if (!form.currentPassword) return setMsg("Current password is required to set a new password.");
      if (!passwordRegex.test(form.newPassword)) return setMsg("New password must be at least 8 characters with uppercase, lowercase, and a number.");
    }

    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      dateOfBirth: `${form.dateOfBirth.day}-${form.dateOfBirth.month}-${form.dateOfBirth.year}`,
      city: form.city,
    };
    if (form.newPassword) {
      payload.currentPassword = form.currentPassword;
      payload.newPassword = form.newPassword;
    }

    const res = await fetch(API, { method: "PUT", headers: authHeaders(), body: JSON.stringify(payload) });
    if (res.ok) {
      const data = await res.json();
      sessionStorage.setItem("firstName", data.firstName);
      navigate("/profile");
    } else {
      const err = await res.json();
      setMsg(err.message || "Update failed");
    }
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div><p>Loading profile...</p></div>;

  return (
    <div className="edit-profile-container">
      <h2 className="edit-profile-title">Edit Profile</h2>
      {msg && <p className={`edit-profile-msg${msg.includes("successfully") ? " success" : " error"}`}>{msg}</p>}
      <form onSubmit={handleSubmit} className="edit-profile-form">
        <label className="form-label">
          First Name:
          <input type="text" name="firstName" className="form-input" value={form.firstName} onChange={handleChange} required />
        </label>
        <label className="form-label">
          Last Name:
          <input type="text" name="lastName" className="form-input" value={form.lastName} onChange={handleChange} required />
        </label>
        <label className="form-label">
          Email:
          <input type="email" name="email" className="form-input" value={form.email} onChange={handleChange} required />
        </label>
        <label className="form-label">
          Birth Date:
          <div className="date-select">
            <select name="day" className="date-input" value={form.dateOfBirth.day} onChange={handleChange} required>
              <option value="" disabled>Day</option>
              {Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
            </select>
            <select name="month" className="date-input" value={form.dateOfBirth.month} onChange={handleChange} required>
              <option value="" disabled>Month</option>
              {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
            </select>
            <select name="year" className="date-input" value={form.dateOfBirth.year} onChange={handleChange} required>
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
          <select name="city" className="form-input" value={form.city} onChange={handleChange} required>
            <option value="" disabled>Select your city</option>
            {filteredCities.map(city => <option key={city} value={city}>{city}</option>)}
          </select>
        </label>

        <hr className="edit-profile-divider" />
        <p className="edit-profile-hint">Leave password fields empty to keep current password.</p>

        <label className="form-label">
          Current Password:
          <input type="password" name="currentPassword" className="form-input" value={form.currentPassword} onChange={handleChange} />
        </label>
        <label className="form-label">
          New Password:
          <input type="password" name="newPassword" className="form-input" value={form.newPassword} onChange={handleChange} />
        </label>

        <div className="edit-profile-actions">
          <button type="button" className="btn-back" onClick={() => navigate("/profile")}>Back</button>
          <button type="submit" className="btn-save">Save Changes</button>
        </div>
      </form>
    </div>
  );
}
