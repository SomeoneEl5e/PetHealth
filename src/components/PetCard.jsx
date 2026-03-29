/**
 * PetCard Component
 * -----------------
 * Displays a single pet's profile card with:
 * - Photo (with defaults for dogs/cats if no custom photo)
 * - Name, breed, age, gender
 * - Edit/delete buttons (only shown in edit mode)
 * - "Add Visit" and "Add Vaccine" action buttons
 * - "AI Health Summary" button
 * - Recent visits table (last 3, sorted newest first)
 * - Recent vaccines table (last 3, sorted newest first)
 * - "Show All" buttons to open full history modals
 *
 * Props:
 * - photoUrl, name, breed, age, type, gender: basic pet info
 * - vetVisits, vaccines: arrays of health records
 * - onDelete, onEdit: pet management callbacks
 * - editMode: boolean to show/hide edit/delete buttons
 * - onShowAllVisits, onShowAllVaccines: open history modals
 * - petId: used for API calls
 * - onOpenAddVaccine, onOpenAddVisit: open add-record forms
 * - onAiSummary: trigger AI health analysis
 */
import React from 'react';
import './PetCard.css';

const defaultDog = "https://res.cloudinary.com/dvjtqajgu/image/upload/v1773090955/pethealth/static/default_dog.png";
const defaultCat = "https://res.cloudinary.com/dvjtqajgu/image/upload/v1773090955/pethealth/static/default_cat.png";

// Helper function to format date as dd/mm/yyyy
const formatDate = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

function PetCard({ photoUrl, name, breed, age, type, gender, vetVisits = [], vaccines = [], onDelete, onEdit, editMode, onShowAllVisits, onShowAllVaccines, petId, onOpenAddVaccine, onOpenAddVisit, onAiSummary }) {
  const src = photoUrl || (type === "Cat" ? defaultCat : defaultDog);
  const photoClass = photoUrl ? "pet-photo pet-photo--user" : "pet-photo pet-photo--default";
  
  // Get last 3 visits, sorted by date descending (newest first)
  const lastVisits = [...vetVisits]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);
  
  // Get last 3 vaccines, sorted by date descending (newest first)
  const lastVaccines = [...vaccines]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);

  return (
    <div className="pet-card">
      {editMode ? (
      <div className="pet-card__top-actions">
        <button className="pet-card__edit-btn" onClick={onEdit} aria-label={`Edit ${name}`}>✎</button>
        <button className="pet-card__delete-btn" onClick={onDelete} aria-label={`Delete ${name}`}>✕</button>
      </div>
      ) : <div className="pet-card__top-actions--placeholder" />}
      <img src={src} alt={name} className={photoClass} />
      <h4 className="pet-name">{name}</h4>
      <p className="pet-details">{breed} • {age} yrs • {gender}</p>

        
      <div className="pet-card__action-btns">
        <button
          className="pet-card__action"
          aria-label={`Add vet visit for ${name}`}
          onClick={() => onOpenAddVisit && onOpenAddVisit({ _id: petId, name, type })}
        >
          + Add Visit
        </button>
        <button
          className="pet-card__action"
          aria-label={`Add vaccine for ${name}`}
          onClick={() => onOpenAddVaccine && onOpenAddVaccine({ _id: petId, name, type })}
        >
          + Add Vaccine
        </button>
      </div>

      <button
        className="pet-card__ai-btn"
        onClick={() => onAiSummary && onAiSummary(petId, name)}
        aria-label={`AI summary for ${name}`}
      >
        🤖 AI Health Summary
      </button>

      <div className="pet-card__section">
        <div className="pet-card__section-header">
          <h5>Recent Visits</h5>
          <button className="pet-card__small-btn"
           onClick={() => onShowAllVisits(name, vetVisits)}>Show All</button>
        </div>

        {lastVisits.length > 0 ? (
          <table className="pet-card__table pet-card__table--visits">
            <thead>
              <tr><th>Date</th><th>Veterinarian</th><th>Reason</th></tr>
            </thead>
            <tbody>
              {lastVisits.map(v => (
                <tr key={v._id || v.date}>
                  <td>{formatDate(v.date)}</td>
                  <td>{v.veterinarian || '—'}</td>
                  <td>{v.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="pet-card__empty">No visits recorded</p>}
      </div>

      <div className="pet-card__section">
        <div className="pet-card__section-header">
          <h5>Recent Vaccines</h5>
          <button className="pet-card__small-btn" 
           onClick={() => onShowAllVaccines(name, vaccines)}>Show All</button>
        </div>
        {lastVaccines.length > 0 ? (
          <table className="pet-card__table pet-card__table--vaccines">
            <thead>
              <tr><th>Date</th><th>Vaccine</th></tr>
            </thead>
            <tbody>
              {lastVaccines.map(v => (
                <tr key={v._id || v.vaccineName + v.date}>
                  <td>{formatDate(v.date)}</td>
                  <td>{v.vaccineName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="pet-card__empty">No vaccines recorded</p>}
      </div>
    </div>
  );
}

export default PetCard;