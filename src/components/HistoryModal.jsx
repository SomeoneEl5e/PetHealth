/**
 * HistoryModal Component
 * ----------------------
 * A full-screen modal overlay displaying the complete history of
 * vet visits or vaccinations for a specific pet.
 *
 * Renders a sortable table (newest first) with all relevant fields.
 * For visits: includes edit/delete action buttons per row.
 * For vaccines: read-only display.
 *
 * Props:
 * - petName: name shown in the modal header
 * - entries: array of visit or vaccine records
 * - type: "visits" or "vaccines" (determines table columns)
 * - onClose: callback to dismiss the modal
 * - onEditVisit: (visit) => void — edit handler (visits only)
 * - onDeleteVisit: (visitId) => void — delete handler (visits only)
 */
import React from 'react';
import './HistoryModal.css';

// Helper function to format date as dd/mm/yyyy
const formatDate = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function HistoryModal({
  petName,
  entries = [],    // array of { date, reason?, vetNotes?, vaccineName? }
  type,            // 'visits' or 'vaccines'
  onClose,
  onEditVisit,     // (visit) => void
  onDeleteVisit    // (visitId) => void
}) {
  const todayStr = formatDate(new Date());

  // sort newest→oldest
  const sorted = [...entries].sort((a,b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <h4>{petName}</h4>
          <span>{todayStr}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </header>

        {sorted.length === 0
          ? <p className="modal-empty">
              {type === 'visits'
                ? 'No past visits'
                : 'No past vaccines'
              }
            </p>
          : (
            <table className={`modal-table ${type === 'visits' ? 'modal-table--visits' : 'modal-table--vaccines'}`}>
              <thead>
                <tr>
                  <th>Date</th>
                  {type === 'visits'
                    ? <>
                        <th>Vet</th>
                        <th>Clinic</th>
                        <th>Reason</th>
                        <th>Notes</th>
                        <th>Actions</th>
                      </>
                    : <>
                        <th>Vet</th>
                        <th>Clinic</th>
                        <th>Vaccine</th>
                        <th>Notes</th>
                      </>
                  }
                </tr>
              </thead>
              <tbody>
                {sorted.map((e,i) => (
                  <tr key={i}>
                    <td>{formatDate(e.date)}</td>
                    {type === 'visits' ? (
                      <>
                        <td>{e.veterinarian || '—'}</td>
                        <td>{e.clinicAddress || '—'}</td>
                        <td>{e.reason}</td>
                        <td>{e.vetNotes || '—'}</td>
                        <td className="visit-actions">
                          <button className="btn-edit-visit" onClick={() => onEditVisit && onEditVisit(e)}>✎</button>
                          <button className="btn-delete-visit" onClick={() => onDeleteVisit && onDeleteVisit(e._id)}>🗑</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{e.veterinarian || '—'}</td>
                        <td>{e.clinicAddress || '—'}</td>
                        <td>{e.vaccineName}</td>
                        <td>{e.vetNotes || '—'}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>
    </div>
  );
}