// src/pages/PersonalData.jsx

import React, { useEffect, useState } from "react";
import PetCard    from "../components/PetCard";
import AddPetForm from "../components/AddPetForm";
import AddVaccineForm from "../components/AddVaccineForm";
import AddVisitForm from "../components/AddVisitForm";
import HistoryModal from "../components/HistoryModal";
import "./PersonalData.css";

export default function PersonalData() {
  const [pets, setPets]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [petTypes, setPetTypes]   = useState([]);
  const [allBreeds, setAllBreeds] = useState([]);
  const [modalInfo, setModalInfo] = useState(null);
  const [showAddVaccine, setShowAddVaccine] = useState(false);
  const [showAddVisit, setShowAddVisit] = useState(false);
  const [currentPet, setCurrentPet] = useState(null);
  const [editingVisit, setEditingVisit] = useState(null);
  const [editingPet, setEditingPet] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPetName, setAiPetName] = useState("");

  // helper to turn an ISO date string into an integer age in years
  function getAgeFromBirthDate(birthDate) {
    if (!birthDate) return "";
    const diffMs = Date.now() - new Date(birthDate).getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
  }

  // fetch existing pets on mount
  useEffect(() => {
    (async () => {
      try {
        const token = sessionStorage.getItem("token");
        const res   = await fetch("http://localhost:5000/api/pets", { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) {
          console.error("Failed to load pets", res.status, await res.text());
          return;
        }
        setPets(await res.json());
      } catch (err) {
        console.error("Error fetching pets:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // show the add‑pet form, fetching types/breeds only once
  const handleShowForm = async () => {
    if (!petTypes.length) {
      const [typesRes, breedsRes] = await Promise.all([
        fetch("http://localhost:5000/api/petTypes"),
        fetch("http://localhost:5000/api/breeds")
      ]);
      if (!typesRes.ok || !breedsRes.ok) return alert("Failed to load types/breeds");
      setPetTypes(await typesRes.json());
      setAllBreeds(await breedsRes.json());
    }
    setShowForm(true);
  };

  // add a new pet
  const handleAddPet = async formData => {
    const token = sessionStorage.getItem("token");
    const res   = await fetch("http://localhost:5000/api/pets", {
      method : "POST",
      headers: { Authorization: `Bearer ${token}` },
      body   : formData
    });
    if (res.ok) { setPets(await res.json()); setShowForm(false); } else alert("Cannot add pet");
  };

  // edit an existing pet
  const handleEditPet = async formData => {
    const token = sessionStorage.getItem("token");
    const res = await fetch(`http://localhost:5000/api/pets/${editingPet._id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    if (res.ok) {
      setPets(await res.json());
      setEditingPet(null);
      setShowForm(false);
    } else alert("Cannot update pet");
  };

  const startEditPet = async (pet) => {
    setEditingPet(pet);
    await handleShowForm();
    setShowForm(true);
  };

  // delete an existing pet, with confirmation
  const handleDeletePet = async id => {
    if (!window.confirm("Are you sure?")) return;
    const token = sessionStorage.getItem("token");
    const res   = await fetch(`http://localhost:5000/api/pets/${id}`, { method:"DELETE", headers:{ Authorization:`Bearer ${token}` } });
    if (res.ok) setPets(await res.json()); else alert("Delete failed");
  };

  const handleShowAllVisits = (petName, visits, petId) => {
    setModalInfo({ type: 'visits', petName, entries: visits, petId });
  };

  const handleShowAllVaccines = (petName, vaccines) => {
    setModalInfo({ type: 'vaccines', petName, entries: vaccines });
  };
  const closeModal = () => setModalInfo(null);

  // handle editing an existing visit
  const handleEditVisit = (visit) => {
    setCurrentPet({ _id: modalInfo.petId, name: modalInfo.petName });
    setEditingVisit(visit);
    setShowAddVisit(true);
  };

  // handle deleting a visit
  const handleDeleteVisit = async (visitId) => {
    if (!window.confirm("Are you sure you want to delete this visit?")) return;
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/pets/${modalInfo.petId}/visits/${visitId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const updatedPets = await res.json();
        setPets(updatedPets);
        // update modal entries
        const updatedPet = updatedPets.find(p => p._id === modalInfo.petId);
        if (updatedPet) {
          setModalInfo(prev => ({ ...prev, entries: updatedPet.vetVisits || [] }));
        }
      } else {
        alert("Failed to delete visit");
      }
    } catch (err) {
      console.error("Error deleting visit:", err);
      alert("An error occurred");
    }
  };

  // handle opening add vaccine form
  const handleOpenAddVaccine = (pet) => {
    setCurrentPet(pet);
    setShowAddVaccine(true);
  };

  // handle saving a new vaccine
  const handleSaveVaccine = async (petId, vaccineData) => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/pets/${petId}/vaccines`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(vaccineData)
      });
      if (res.ok) {
        setPets(await res.json());
        setShowAddVaccine(false);
        setCurrentPet(null);
      } else {
        alert("Failed to add vaccine");
      }
    } catch (err) {
      console.error("Error adding vaccine:", err);
      alert("An error occurred");
    }
  };

  // handle opening add visit form
  const handleOpenAddVisit = (pet) => {
    setCurrentPet(pet);
    setShowAddVisit(true);
  };

  // handle saving a new or edited vet visit
  const handleSaveVisit = async (petId, visitData, visitId) => {
    try {
      const token = sessionStorage.getItem("token");
      const url = visitId
        ? `http://localhost:5000/api/pets/${petId}/visits/${visitId}`
        : `http://localhost:5000/api/pets/${petId}/visits`;
      const method = visitId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(visitData)
      });
      if (res.ok) {
        const updatedPets = await res.json();
        setPets(updatedPets);
        setShowAddVisit(false);
        setCurrentPet(null);
        setEditingVisit(null);
        // update modal entries if modal is open
        if (modalInfo && modalInfo.petId === petId) {
          const updatedPet = updatedPets.find(p => p._id === petId);
          if (updatedPet) {
            setModalInfo(prev => ({ ...prev, entries: updatedPet.vetVisits || [] }));
          }
        }
      } else {
        alert(visitId ? "Failed to edit visit" : "Failed to add visit");
      }
    } catch (err) {
      console.error("Error saving visit:", err);
      alert("An error occurred");
    }
  };

  // AI summary handler
  const handleAiSummary = async (petId, petName) => {
    setAiPetName(petName);
    setAiSummary(null);
    setAiLoading(true);
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/ai/pet-summary", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ petId })
      });
      if (res.ok) {
        const data = await res.json();
        setAiSummary(data.summary);
      } else {
        const err = await res.json();
        setAiSummary("⚠️ " + (err.message || "Failed to generate summary."));
      }
    } catch {
      setAiSummary("⚠️ Could not connect to the AI service.");
    } finally {
      setAiLoading(false);
    }
  };

  // Simple markdown to HTML converter
  const formatMarkdown = (text) => {
    if (!text) return "";
    return text
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/^### (.+)$/gm, "<h5>$1</h5>")
      .replace(/^## (.+)$/gm, "<h4>$1</h4>")
      .replace(/^# (.+)$/gm, "<h3>$1</h3>")
      .replace(/^- (.+)$/gm, "<li>$1</li>")
      .replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>")
      .replace(/\n{2,}/g, "<br/><br/>")
      .replace(/\n/g, "<br/>");
  };

  return (
    <div className="profile-container">
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading pets...</p>
        </div>
      ) : (
      <>
      <div className="profile-header">
        <button className={`edit-mode-btn${editMode ? " active" : ""}`} onClick={() => setEditMode(m => !m)}>{editMode ? "Done" : "✎ Edit"}</button>
        <button className="add-pet-btn" onClick={() => { setEditingPet(null); handleShowForm(); }}>+ Add Pet</button>
      </div>
      <div className="pet-grid">
        {pets.length === 0 && <div className="no-pets">No Pets</div>}
        {pets.length > 0 && pets.map(p => {
          try {
            return (
              <PetCard
                key={p._id}
                photoUrl={p.photoUrl}
                type={p.type}
                name={p.name}
                breed={p.breed}
                age={getAgeFromBirthDate(p.birthDate)}
                gender={p.gender}
                petId={p._id}
                vetVisits={p.vetVisits || []}
                vaccines={p.vaccines || []}
                onDelete={() => handleDeletePet(p._id)}
                onEdit={() => startEditPet(p)}
                editMode={editMode}
                onShowAllVisits={() => handleShowAllVisits(p.name, p.vetVisits, p._id)}
                onShowAllVaccines={() => handleShowAllVaccines(p.name, p.vaccines)}
                onOpenAddVaccine={() => handleOpenAddVaccine({ _id: p._id, name: p.name, type: p.type })}
                onOpenAddVisit={() => handleOpenAddVisit({ _id: p._id, name: p.name, type: p.type })}
                onAiSummary={handleAiSummary}
              />
            );
          } catch (err) {
            console.error("Error rendering pet card:", err, p);
            return <div key={p._id}>Error rendering pet</div>;
          }
        })}
      </div>

      {showForm && (
        <AddPetForm
          key={editingPet ? editingPet._id : "new"}
          petTypes={petTypes}
          allBreeds={allBreeds}
          editingPet={editingPet}
          onCancel={() => { setShowForm(false); setEditingPet(null); }}
          onSave={editingPet ? handleEditPet : handleAddPet}
        />
      )}

      {modalInfo && (
        <HistoryModal
          petName={modalInfo.petName}
          entries={modalInfo.entries}
          type={modalInfo.type}
          onClose={closeModal}
          onEditVisit={handleEditVisit}
          onDeleteVisit={handleDeleteVisit}
        />
      )}

      {showAddVaccine && currentPet && (
        <AddVaccineForm
          pet={currentPet}
          onCancel={() => {
            setShowAddVaccine(false);
            setCurrentPet(null);
          }}
          onSave={handleSaveVaccine}
        />
      )}

      {showAddVisit && currentPet && (
        <AddVisitForm
          pet={currentPet}
          initialData={editingVisit}
          onCancel={() => {
            setShowAddVisit(false);
            setCurrentPet(null);
            setEditingVisit(null);
          }}
          onSave={handleSaveVisit}
        />
      )}

      {(aiLoading || aiSummary) && (
        <div className="modal-backdrop" onClick={() => { if (!aiLoading) { setAiSummary(null); setAiPetName(""); } }}>
          <div className="modal-content ai-summary-modal" onClick={e => e.stopPropagation()}>
            <header className="modal-header">
              <h4>🤖 AI Health Summary — {aiPetName}</h4>
              <button className="modal-close" onClick={() => { setAiSummary(null); setAiPetName(""); setAiLoading(false); }}>✕</button>
            </header>
            <div className="ai-summary-body">
              {aiLoading
                ? <div className="ai-loading"><div className="ai-spinner"></div><p>Analyzing pet health data...</p></div>
                : <div className="ai-summary-content" dangerouslySetInnerHTML={{ __html: formatMarkdown(aiSummary) }} />
              }
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
);
}