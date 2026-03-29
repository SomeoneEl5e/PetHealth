/**
 * AddPetForm Component
 * --------------------
 * A modal form for adding a new pet or editing an existing one.
 *
 * Features:
 * - Photo upload with live preview (defaults to question mark placeholder)
 * - Pet type dropdown (fetched from server)
 * - Breed dropdown filtered by selected pet type, with "Mixed" and "Unknown" always available
 * - Date picker for birth date, gender selector
 * - Submits as FormData (multipart) to support file upload
 *
 * Props:
 * - petTypes: array of available pet types
 * - allBreeds: array of all breeds (filtered client-side by type)
 * - onCancel: callback to close the form
 * - onSave: callback with FormData when submitted
 * - editingPet: (optional) existing pet object to pre-fill for editing
 */
import React, { useState } from "react";
import "./AddPetForm.css";

const questionMark = "https://res.cloudinary.com/dvjtqajgu/image/upload/v1773090955/pethealth/static/question-mark.png";

export default function AddPetForm({ petTypes, allBreeds, onCancel, onSave, editingPet }) {
  const [form, setForm] = useState({
    name:      editingPet?.name || "",
    type:      editingPet?.type || "",
    breed:     editingPet?.breed || "",
    birthDate: editingPet?.birthDate ? editingPet.birthDate.slice(0, 10) : "",
    gender:    editingPet?.gender || ""
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [preview, setPreview]     = useState(editingPet?.photoUrl || null);

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handlePhoto = e => {
    const file = e.target.files[0];
    setPhotoFile(file);
    setPreview(URL.createObjectURL(file));
  };
  
  const handleSubmit = e => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => data.append(k, v));
    if (photoFile) data.append("photo", photoFile);
    onSave(data);
  };

  // only show breeds for the chosen type, always include Mixed & Unknown
  const filteredBreeds = allBreeds.filter(b => b.type === form.type);
  const hasBreeds = filteredBreeds.length > 0;

  return (
    <div className="add-pet-modal">
      <div className="add-pet-form">
        <form onSubmit={handleSubmit}>
          <div className="photo-upload">
            <img src={preview || questionMark} alt="preview" className="preview-img" />
            <input type="file" accept="image/*" onChange={handlePhoto} />
          </div>
          <input name="name" placeholder="Pet Name" value={form.name} onChange={handleChange} required />
          <select name="type" value={form.type} onChange={handleChange} required>
            <option value="">Select Pet Type</option>
            {petTypes.map(pt => <option key={pt._id} value={pt.petType}>{pt.petType}</option>)}
          </select>
          <select name="breed" value={form.breed} onChange={handleChange} disabled={!form.type} required>
            <option value="">Select Breed</option>
            {filteredBreeds.map(b => <option key={b._id} value={b.breed}>{b.breed}</option>)}
            {form.type && <>
              {hasBreeds && <option disabled>───────────</option>}
              <option value="Mixed">Mixed</option>
              <option value="Unknown">Unknown</option>
            </>}
          </select>
          <input type="date" name="birthDate" value={form.birthDate} onChange={handleChange} required />
          <select name="gender" value={form.gender} onChange={handleChange} required>
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          <div className="form-actions">
            <button type="submit" className="btn-submit">{editingPet ? "Save Changes" : "Submit"}</button>
            <button type="button" onClick={onCancel} className="btn-cancel">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
