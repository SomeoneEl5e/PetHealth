import React, { useEffect, useState } from "react";
import "./AddVaccineForm.css";

export default function AddVaccineForm({
  pet,
  onCancel,
  onSave,       // (petId, { date, vaccineName, veterinarian, clinicAddress, notes }) => void
  apiBase = "http://localhost:5000"
}) {
  const [vaccineOptions, setVaccineOptions] = useState([]);
  const [form, setForm] = useState({
    date: "",
    veterinarian: "",
    clinicAddress: "",
    vaccineName: "",
    notes: ""
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // fetch master list of vaccines filtered by pet type
    (async () => {
      try {
        const res = await fetch(
          `${apiBase}/api/vaccines?petType=${encodeURIComponent(pet.type)}`
        );
        if (!res.ok) throw new Error(res.status);
        setVaccineOptions(await res.json());
      } catch (err) {
        console.error("Could not fetch vaccines list", err);
      }
    })();
  }, [pet.type]);

  const handleChange = e =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  // Get today's date in YYYY-MM-DD format for max date restriction
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.date || !form.vaccineName) return;
    setLoading(true);
    await onSave(pet._id, form);
    setLoading(false);
  };

  return (
    <div className="modal-backdrop">
      <div className="add-vaccine-form">
        <header>
          <h3>Add Vaccine for <em>{pet.name}</em></h3>
          <button className="close-btn" onClick={onCancel}>✕</button>
        </header>
        <form onSubmit={handleSubmit}>
          <label>
            Vaccine Date
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              max={getTodayDate()}
              required
            />
          </label>
          <label>
            Veterinarian Name
            <input
              type="text"
              name="veterinarian"
              placeholder="Enter veterinarian name"
              value={form.veterinarian}
              onChange={handleChange}
            />
          </label>
          <label>
            Clinic Address
            <input
              type="text"
              name="clinicAddress"
              placeholder="Enter clinic address"
              value={form.clinicAddress}
              onChange={handleChange}
            />
          </label>
          <label>
            Vaccine
            <select
              name="vaccineName"
              value={form.vaccineName}
              onChange={handleChange}
              required
            >
              <option value="">Select Vaccine</option>
              {vaccineOptions.map(v => (
                <option key={v._id} value={v.Name}>{v.Name}</option>
              ))}
            </select>
          </label>
          <label>
            Additional Notes
            <textarea
              name="notes"
              placeholder="Any additional notes about the vaccine (optional)"
              value={form.notes}
              onChange={handleChange}
              rows="4"
            />
          </label>
          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? "Adding…" : "Add Vaccine"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}