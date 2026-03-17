import React, { useState } from "react";
import "./AddVisitForm.css";

export default function AddVisitForm({
  pet,
  onCancel,
  onSave,       // (petId, { date, veterinarian, reason, notes }, visitId?) => void
  initialData   // optional: existing visit object for editing
}) {
  const isEditing = !!initialData;
  const [form, setForm] = useState({
    date: initialData ? new Date(initialData.date).toISOString().split('T')[0] : "",
    veterinarian: initialData?.veterinarian || "",
    clinicAddress: initialData?.clinicAddress || "",
    reason: initialData?.reason || "",
    notes: initialData?.vetNotes || ""
  });
  const [loading, setLoading] = useState(false);

  const handleChange = e =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  // Get today's date in YYYY-MM-DD format for max date restriction
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.date || !form.veterinarian || !form.reason || !form.clinicAddress) return;
    setLoading(true);
    await onSave(pet._id, form, isEditing ? initialData._id : undefined);
    setLoading(false);
  };

  return (
    <div className="modal-backdrop">
      <div className="add-visit-form">
        <header>
          <h3>{isEditing ? 'Edit' : 'Add'} Vet Visit for <em>{pet.name}</em></h3>
          <button className="close-btn" onClick={onCancel}>✕</button>
        </header>
        <form onSubmit={handleSubmit}>
          <label>
            Visit Date
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
              required
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
              required
            />
          </label>
          <label>
            Reason for Visit
            <input
              type="text"
              name="reason"
              placeholder="e.g., Checkup, Vaccination, Injury"
              value={form.reason}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Additional Notes
            <textarea
              name="notes"
              placeholder="Any additional notes about the visit (optional)"
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
              {loading ? (isEditing ? "Saving…" : "Adding…") : (isEditing ? "Save Changes" : "Add Visit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
