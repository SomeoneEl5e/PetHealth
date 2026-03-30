/**
 * Admin Page — Management Dashboard
 * ==================================
 * The main management interface for editors, sub-admins, and admins.
 *
 * Tabs (shown based on role):
 * 1. Vaccine Types — CRUD for master vaccine list (all staff)
 * 2. Pet Types — CRUD for pet type categories (all staff)
 * 3. Breeds — CRUD for breeds linked to pet types (all staff)
 * 4. Users — View/edit/delete users, reset passwords, pass admin role (sub-admin/admin)
 * 5. User Statistics — Population-level analytics with charts and filters (sub-admin/admin)
 * 6. Activity — Staff performance tracking and audit trail (sub-admin/admin)
 *
 * Features:
 * - Sortable tables with column header click-to-sort
 * - Status filtering (active/disabled/pending) for entity tables
 * - Date range filtering for creation time
 * - Editor restrictions: can only modify own items within 24h
 * - Statistics charts: donut, bar, and column visualizations
 * - Activity breakdown by staff member, action type, and target
 *
 * All data operations go through /api/admin endpoints.
 */
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { API_BASE } from "../config";
import "./Admin.css";

// API base URL for admin endpoints
const API = `${API_BASE}/api/admin`;

/** Helper: Retrieve JWT token from session storage */
function getToken() {
  return sessionStorage.getItem("token");
}

/** Helper: Build Authorization and Content-Type headers for API requests */
function authHeaders() {
  return {
    Authorization: `Bearer ${getToken()}`,
    "Content-Type": "application/json",
  };
}

export default function Admin() {
  // ─── Role-based access flags ──────────────────────────────
  const role = sessionStorage.getItem("role");
  const canManage = ["editor", "sub-admin", "admin"].includes(role);     // Can access admin panel
  const canViewUsers = ["sub-admin", "admin"].includes(role);            // Can see Users/Stats tabs
  const isAdmin = role === "admin";
  const isSubAdmin = role === "sub-admin";
  const isEditor = role === "editor";
  const userId = sessionStorage.getItem("userId");

  /** Check if the current user (editor) can modify a specific item.
   *  Editors can only edit their own items within 24 hours of creation. */
  const canEditItem = (item) => {
    if (!isEditor) return true;
    if (!item.createdBy || item.createdBy !== userId) return false;
    if (!item.createdAt) return false;
    return Date.now() - new Date(item.createdAt).getTime() <= 24 * 60 * 60 * 1000;
  };

  // ─── Tab and filter state ─────────────────────────────────
  const [tab, setTab] = useState("vaccines");
  const [dateFrom, setDateFrom] = useState("");          // Creation date filter: start
  const [dateTo, setDateTo] = useState("");              // Creation date filter: end
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "active", "disabled", "pending"
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  /** Filter items by creation date range (used for admin/sub-admin date filtering) */
  const canFilter = isAdmin || isSubAdmin;
  const filterByTime = (item) => {
    if (!canFilter) return true;
    if (!dateFrom && !dateTo) return true;
    if (!item.createdAt) return true;
    const created = new Date(item.createdAt);
    if (dateFrom && created < new Date(dateFrom)) return false;
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      if (created > end) return false;
    }
    return true;
  };

  // ─── Table sort state ─────────────────────────────────────
  // Resets to default (createdAt desc) when switching tabs
  const [sortCol, setSortCol] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  useEffect(() => { setSortCol("createdAt"); setSortDir("desc"); setStatusFilter("all"); }, [tab]);

  /** Toggle sort direction on a column, or switch to a new sort column */
  const toggleSort = (col) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir(col === "createdAt" ? "desc" : "asc");
    }
  };

  /** Sort an array of items by the current sortCol/sortDir.
   *  Secondary sort by createdAt (desc) when primary values are equal. */
  const sortData = (items) => [...items].sort((a, b) => {
    let valA, valB;
    if (sortCol === "createdAt") {
      valA = new Date(a.createdAt || 0).getTime();
      valB = new Date(b.createdAt || 0).getTime();
    } else {
      valA = a[sortCol];
      valB = b[sortCol];
      if (Array.isArray(valA)) valA = valA.join(", ");
      if (Array.isArray(valB)) valB = valB.join(", ");
      if (typeof valA === "number" && typeof valB === "number") { /* keep */ }
      else { valA = (valA || "").toString().toLowerCase(); valB = (valB || "").toString().toLowerCase(); }
    }
    if (valA < valB) return sortDir === "asc" ? -1 : 1;
    if (valA > valB) return sortDir === "asc" ? 1 : -1;
    if (sortCol !== "createdAt") return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    return 0;
  });

  /** SortTh — Clickable table header cell with sort indicator */
  const SortTh = ({ col, children }) => (
    <th className={`sortable-th${sortCol === col ? " sorted" : ""}`} onClick={() => toggleSort(col)}>
      {children}<span className="sort-arrow">{sortCol === col ? (sortDir === "asc" ? " ▲" : " ▼") : ""}</span>
    </th>
  );

  // ─── Vaccine types state ──────────────────────────────────
  const [vaccines, setVaccines] = useState([]);
  const [vaccForm, setVaccForm] = useState({ Name: "", Timing: "", PetType: [] });
  const [editingVacc, setEditingVacc] = useState(null);

  // ─── Users state ──────────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ firstName: "", lastName: "", email: "", role: "user", password: "" });
  const [expandedUser, setExpandedUser] = useState(null);       // User ID shown expanded in table
  const [userSearchName, setUserSearchName] = useState("");     // Search by name
  const [userSearchEmail, setUserSearchEmail] = useState("");   // Search by email
  const [userSearchRole, setUserSearchRole] = useState("");     // Filter by role
  const [expandedPetVisits, setExpandedPetVisits] = useState(null);   // Pet ID showing visit details
  const [expandedPetVaccines, setExpandedPetVaccines] = useState(null); // Pet ID showing vaccine details

  // ─── Pet types state ──────────────────────────────────────
  const [petTypes, setPetTypes] = useState([]);
  const [ptForm, setPtForm] = useState({ petType: "" });
  const [editingPt, setEditingPt] = useState(null);

  // ─── Breeds state ─────────────────────────────────────────
  const [breeds, setBreeds] = useState([]);
  const [breedForm, setBreedForm] = useState({ breed: "", type: "" });
  const [editingBreed, setEditingBreed] = useState(null);

  // ─── Statistics state ─────────────────────────────────────
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [petsOnly, setPetsOnly] = useState(false);  // Filter to show only users with pets

  // ─── Statistics filter options ─────────────────────────────
  const [statsFilterOptions, setStatsFilterOptions] = useState(null);
  const [statsFilters, setStatsFilters] = useState({
    petTypes: [], cities: [], genders: [], breeds: [],
    vaccineNames: [], ageGroups: [],
    periodFrom: "", periodTo: ""
  });
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // ─── Activity tracking state ──────────────────────────────
  const [activity, setActivity] = useState(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityRoles, setActivityRoles] = useState(["editor", "sub-admin", "admin"]);
  const [expandedStaff, setExpandedStaff] = useState(null);
  const [activityPeriodFrom, setActivityPeriodFrom] = useState("");
  const [activityPeriodTo, setActivityPeriodTo] = useState("");

  // ─── Data fetching helpers ────────────────────────────────
  const fetchVaccines = async () => {
    const res = await fetch(`${API}/vaccines`, { headers: authHeaders() });
    if (res.ok) setVaccines(await res.json());
  };

  const fetchUsers = async () => {
    const res = await fetch(`${API}/users`, { headers: authHeaders() });
    if (res.ok) setUsers(await res.json());
  };

  const fetchPetTypes = async () => {
    const res = await fetch(`${API}/petTypes`, { headers: authHeaders() });
    if (res.ok) setPetTypes(await res.json());
  };

  const fetchBreeds = async () => {
    const res = await fetch(`${API}/breeds`, { headers: authHeaders() });
    if (res.ok) setBreeds(await res.json());
  };

  const fetchStatsFilters = async () => {
    try {
      const res = await fetch(`${API}/statistics/filters`, { headers: authHeaders() });
      if (res.ok) setStatsFilterOptions(await res.json());
    } catch { /* ignore */ }
  };

  const buildStatsQuery = (po, filters) => {
    const params = new URLSearchParams();
    if (po) params.set("petsOnly", "true");
    if (filters.petTypes.length) params.set("petTypes", filters.petTypes.join(","));
    if (filters.cities.length) params.set("cities", filters.cities.join(","));
    if (filters.genders.length) params.set("genders", filters.genders.join(","));
    if (filters.breeds.length) params.set("breeds", filters.breeds.join(","));
    if (filters.vaccineNames.length) params.set("vaccineNames", filters.vaccineNames.join(","));
    if (filters.ageGroups.length) params.set("ageGroups", filters.ageGroups.join(","));
    if (filters.periodFrom) params.set("periodFrom", filters.periodFrom);
    if (filters.periodTo) params.set("periodTo", filters.periodTo);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  };

  const fetchStats = async (po, filters) => {
    const f = filters || statsFilters;
    setStatsLoading(true);
    try {
      const q = buildStatsQuery(po, f);
      const res = await fetch(`${API}/statistics${q}`, { headers: authHeaders() });
      if (res.ok) setStats(await res.json());
    } finally {
      setStatsLoading(false);
    }
  };

  const toggleStatsFilter = (key, value) => {
    setStatsFilters(prev => {
      const arr = prev[key];
      const next = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
      const updated = { ...prev, [key]: next };
      // When pet types change, remove breed selections that no longer match
      if (key === "petTypes" && statsFilterOptions && next.length > 0) {
        const validBreeds = statsFilterOptions.breeds
          .filter(b => b.petTypes.some(t => next.includes(t)))
          .map(b => b.breed);
        updated.breeds = prev.breeds.filter(b => validBreeds.includes(b));
      }
      fetchStats(petsOnly, updated);
      return updated;
    });
  };

  const setStatsDateFilter = (key, value) => {
    setStatsFilters(prev => {
      const updated = { ...prev, [key]: value };
      fetchStats(petsOnly, updated);
      return updated;
    });
  };

  const resetStatsFilters = () => {
    const empty = { petTypes: [], cities: [], genders: [], breeds: [], vaccineNames: [], ageGroups: [], periodFrom: "", periodTo: "" };
    setStatsFilters(empty);
    fetchStats(petsOnly, empty);
  };

  const activeFilterCount = Object.entries(statsFilters).reduce((n, [, v]) => n + (Array.isArray(v) ? v.length : (v ? 1 : 0)), 0);

  const fetchActivity = async (from, to) => {
    const pFrom = from !== undefined ? from : activityPeriodFrom;
    const pTo = to !== undefined ? to : activityPeriodTo;
    setActivityLoading(true);
    try {
      const params = new URLSearchParams();
      if (pFrom) params.set("periodFrom", pFrom);
      if (pTo) params.set("periodTo", pTo);
      const qs = params.toString();
      const res = await fetch(`${API}/activity-stats${qs ? `?${qs}` : ""}`, { headers: authHeaders() });
      if (res.ok) setActivity(await res.json());
    } finally {
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    if (!canManage) return;
    if (tab === "vaccines") { fetchVaccines(); fetchPetTypes(); }
    else if (tab === "users") { if (canViewUsers) fetchUsers(); }
    else if (tab === "petTypes") fetchPetTypes();
    else if (tab === "breeds") { fetchBreeds(); fetchPetTypes(); }
    else if (tab === "statistics") { if (canViewUsers) { fetchStats(petsOnly, statsFilters); fetchStatsFilters(); } }
    else if (tab === "activity") { if (canViewUsers) fetchActivity(); }
  }, [tab]);

  // redirect users with no manage access
  if (!canManage) return <Navigate to="/" />;

  // ─── VACCINE TYPES HANDLERS ─────────────────────

  const handleVaccChange = (e) => {
    const { name, value } = e.target;
    setVaccForm((f) => ({ ...f, [name]: value }));
  };

  const togglePetType = (pt) => {
    setVaccForm((f) => {
      const arr = Array.isArray(f.PetType) ? f.PetType : [];
      return {
        ...f,
        PetType: arr.includes(pt) ? arr.filter((t) => t !== pt) : [...arr, pt],
      };
    });
  };

  const handleVaccSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...vaccForm, Timing: Number(vaccForm.Timing) };
    const url = editingVacc ? `${API}/vaccines/${editingVacc._id}` : `${API}/vaccines`;
    const method = editingVacc ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });
    if (res.ok) {
      setVaccines(await res.json());
      setVaccForm({ Name: "", Timing: "", PetType: [] });
      setEditingVacc(null);
    } else {
      const err = await res.json();
      alert(err.message || "Error");
    }
  };

  const startEditVacc = (v) => {
    setEditingVacc(v);
    setVaccForm({ Name: v.Name, Timing: String(v.Timing), PetType: v.PetType });
  };

  const cancelEditVacc = () => {
    setEditingVacc(null);
    setVaccForm({ Name: "", Timing: "", PetType: [] });
  };

  const handleToggleVacc = async (id) => {
    const res = await fetch(`${API}/vaccines/${id}/toggle`, { method: "PATCH", headers: authHeaders() });
    if (res.ok) setVaccines(await res.json());
    else alert("Toggle failed");
  };

  const isWithin24h = (item) => item.createdAt && Date.now() - new Date(item.createdAt).getTime() <= 24 * 60 * 60 * 1000;

  const handleDeleteVacc = async (id) => {
    if (!confirm("Delete this vaccine permanently?")) return;
    const res = await fetch(`${API}/vaccines/${id}`, { method: "DELETE", headers: authHeaders() });
    if (res.ok) setVaccines(await res.json());
    else { const err = await res.json(); alert(err.message || "Delete failed"); }
  };

  // ─── USERS HANDLERS ─────────────────────────────

  const startEditUser = (u) => {
    setEditingUser(u);
    setUserForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, role: u.role || "user", password: "" });
  };

  const cancelEditUser = () => {
    setEditingUser(null);
    setUserForm({ firstName: "", lastName: "", email: "", role: "user", password: "" });
  };

  const handleUserChange = (e) => {
    setUserForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    const payload = { ...userForm };
    if (!payload.password) delete payload.password;
    const res = await fetch(`${API}/users/${editingUser._id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(payload) });
    if (res.ok) {
      setUsers(await res.json());
      cancelEditUser();
    } else {
      const err = await res.json();
      alert(err.message || "Error");
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Delete this user? This will also delete all their pets.")) return;
    const res = await fetch(`${API}/users/${id}`, { method: "DELETE", headers: authHeaders() });
    if (res.ok) setUsers(await res.json());
    else {
      const err = await res.json();
      alert(err.message || "Delete failed");
    }
  };

  const [resetPwUserId, setResetPwUserId] = useState(null);
  const [resetPwValue, setResetPwValue] = useState("");

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetPwUserId || !resetPwValue) return;
    const res = await fetch(`${API}/users/${resetPwUserId}/reset-password`, {
      method: "POST", headers: authHeaders(), body: JSON.stringify({ password: resetPwValue }),
    });
    if (res.ok) {
      alert("Password reset successfully");
      setResetPwUserId(null);
      setResetPwValue("");
    } else {
      const err = await res.json();
      alert(err.message || "Error");
    }
  };

  const handlePassRole = async (targetId) => {
    if (!window.confirm("Transfer your admin role to this user? You will become a sub-admin.")) return;
    const res = await fetch(`${API}/pass-role`, {
      method: "POST", headers: authHeaders(), body: JSON.stringify({ targetUserId: targetId }),
    });
    if (res.ok) {
      const data = await res.json();
      sessionStorage.setItem("role", data.newRole);
      window.location.reload();
    } else {
      const err = await res.json();
      alert(err.message || "Error");
    }
  };

  // ─── FORMATTERS ──────────────────────────────────

  const formatDate = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
  };

  // ─── PET TYPES HANDLERS ──────────────────────────

  const handlePtChange = (e) => setPtForm({ petType: e.target.value });

  const handlePtSubmit = async (e) => {
    e.preventDefault();
    const exists = petTypes.some(
      (pt) => pt.petType.toLowerCase() === ptForm.petType.trim().toLowerCase()
    );
    if (exists && !editingPt) {
      alert("This pet type already exists.");
      return;
    }
    const url = editingPt ? `${API}/petTypes/${editingPt._id}` : `${API}/petTypes`;
    const method = editingPt ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(ptForm) });
    if (res.ok) {
      setPetTypes(await res.json());
      setPtForm({ petType: "" });
      setEditingPt(null);
    } else {
      const err = await res.json();
      alert(err.message || "Error");
    }
  };

  const startEditPt = (pt) => { setEditingPt(pt); setPtForm({ petType: pt.petType }); };
  const cancelEditPt = () => { setEditingPt(null); setPtForm({ petType: "" }); };

  const handleDeletePt = async (id) => {
    if (!window.confirm("Delete this pet type?")) return;
    const res = await fetch(`${API}/petTypes/${id}`, { method: "DELETE", headers: authHeaders() });
    if (res.ok) setPetTypes(await res.json());
    else alert("Delete failed");
  };

  const handleTogglePt = async (id) => {
    const res = await fetch(`${API}/petTypes/${id}/toggle`, { method: "PATCH", headers: authHeaders() });
    if (res.ok) setPetTypes(await res.json());
    else alert("Toggle failed");
  };

  // ─── BREEDS HANDLERS ─────────────────────────────

  const handleBreedChange = (e) => setBreedForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleBreedSubmit = async (e) => {
    e.preventDefault();
    // prevent adding a duplicate
    const exists = breeds.some(
      (b) => b.breed.toLowerCase() === breedForm.breed.trim().toLowerCase() && b.type === breedForm.type
    );
    if (exists && !editingBreed) {
      alert("This breed already exists for the selected pet type.");
      return;
    }
    const url = editingBreed ? `${API}/breeds/${editingBreed._id}` : `${API}/breeds`;
    const method = editingBreed ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(breedForm) });
    if (res.ok) {
      setBreeds(await res.json());
      setBreedForm({ breed: "", type: "" });
      setEditingBreed(null);
    } else {
      const err = await res.json();
      alert(err.message || "Error");
    }
  };

  const startEditBreed = (b) => { setEditingBreed(b); setBreedForm({ breed: b.breed, type: b.type }); };
  const cancelEditBreed = () => { setEditingBreed(null); setBreedForm({ breed: "", type: "" }); };

  const handleDeleteBreed = async (id) => {
    if (!window.confirm("Delete this breed?")) return;
    const res = await fetch(`${API}/breeds/${id}`, { method: "DELETE", headers: authHeaders() });
    if (res.ok) setBreeds(await res.json());
    else alert("Delete failed");
  };

  const handleToggleBreed = async (id) => {
    const res = await fetch(`${API}/breeds/${id}/toggle`, { method: "PATCH", headers: authHeaders() });
    if (res.ok) setBreeds(await res.json());
    else alert("Toggle failed");
  };

  // ─── RENDER ──────────────────────────────────────

  return (
    <div className="admin-container">
      <h2 className="admin-title">Manage Panel</h2>

      <div className="admin-tabs">
        <button className={`admin-tab ${tab === "vaccines" ? "active" : ""}`} onClick={() => setTab("vaccines")}>Vaccine Types</button>
        <button className={`admin-tab ${tab === "petTypes" ? "active" : ""}`} onClick={() => setTab("petTypes")}>Pet Types</button>
        <button className={`admin-tab ${tab === "breeds" ? "active" : ""}`} onClick={() => setTab("breeds")}>Breeds</button>
        {canViewUsers && <button className={`admin-tab ${tab === "users" ? "active" : ""}`} onClick={() => setTab("users")}>Users</button>}
        {canViewUsers && <button className={`admin-tab ${tab === "statistics" ? "active" : ""}`} onClick={() => setTab("statistics")}>User Statistics</button>}
        {canViewUsers && <button className={`admin-tab ${tab === "activity" ? "active" : ""}`} onClick={() => setTab("activity")}>Activity</button>}
      </div>

      {/* ─── VACCINE TYPES TAB ─── */}
      {tab === "vaccines" && (
        <div className="admin-section">
          {canFilter && (
            <div className="admin-time-filter">
              <label>From:</label>
              <input type="date" value={dateFrom} max={dateTo || today} onChange={(e) => setDateFrom(e.target.value)} />
              <label>To:</label>
              <input type="date" value={dateTo} min={dateFrom || undefined} max={today} onChange={(e) => setDateTo(e.target.value)} />
              <button type="button" className="btn-clear-filter" onClick={() => { setDateFrom(""); setDateTo(""); }}>Clear</button>
              <span className="filter-separator"></span>
              <label>Status:</label>
              <select className="status-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          )}
          {!canFilter && (
            <div className="admin-time-filter">
              <label>Status:</label>
              <select className="status-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          )}
          <form className="admin-form" onSubmit={handleVaccSubmit}>
            <input name="Name" placeholder="Search or add vaccine..." value={vaccForm.Name} onChange={handleVaccChange} required />
            <input name="Timing" type="number" placeholder="Timing (months)" value={vaccForm.Timing} onChange={handleVaccChange} required min="0" />
            <div className="pet-type-picker">
              <span className="pet-type-picker__label">Pet Types:</span>
              <div className="pet-type-picker__options">
                {petTypes.map((pt) => (
                  <label key={pt._id} className={`pet-type-chip${Array.isArray(vaccForm.PetType) && vaccForm.PetType.includes(pt.petType) ? " pet-type-chip--active" : ""}`}>
                    <input
                      type="checkbox"
                      checked={Array.isArray(vaccForm.PetType) && vaccForm.PetType.includes(pt.petType)}
                      onChange={() => togglePetType(pt.petType)}
                    />
                    {pt.petType}
                  </label>
                ))}
                {petTypes.length === 0 && <span className="pet-type-picker__empty">No pet types defined</span>}
              </div>
            </div>
            <div className="admin-form-actions">
              {editingVacc && <button type="button" className="btn-cancel" onClick={cancelEditVacc}>Cancel</button>}
              <button type="submit" className="btn-submit">{editingVacc ? "Save Changes" : "Add Vaccine Type"}</button>
            </div>
          </form>
          <table className="admin-table">
            <thead>
              <tr>
                <SortTh col="Name">Name</SortTh>
                <SortTh col="Timing">Timing (months)</SortTh>
                <SortTh col="PetType">Pet Types</SortTh>
                <SortTh col="createdByName">Added By</SortTh>
                <SortTh col="createdAt">Date Added</SortTh>
                <SortTh col="disabled">Status</SortTh>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortData(vaccines
                .filter((v) => {
                  const q = vaccForm.Name.trim().toLowerCase();
                  const pend = isWithin24h(v) && !v.disabled;
                  if (statusFilter === "active" && (v.disabled || pend)) return false;
                  if (statusFilter === "disabled" && !v.disabled) return false;
                  if (statusFilter === "pending" && !pend) return false;
                  return (!q || v.Name.toLowerCase().includes(q)) && filterByTime(v);
                }))
                .map((v) => {
                const pending = isWithin24h(v) && !v.disabled;
                return (
                <tr key={v._id} className={v.disabled ? "row-disabled" : ""}>
                  <td>{v.Name}</td>
                  <td>{v.Timing}</td>
                  <td>{v.PetType.join(", ")}</td>
                  <td>{v.createdByName || "Unknown"}</td>
                  <td>{formatDate(v.createdAt)}</td>
                  <td><span className={`status-badge ${v.disabled ? "status-badge--disabled" : pending ? "status-badge--pending" : "status-badge--active"}`}>{v.disabled ? "Disabled" : pending ? "Pending" : "Active"}</span></td>
                  <td className="admin-actions">
                    {canEditItem(v) && <button className="btn-edit" onClick={() => startEditVacc(v)}>✎</button>}
                    {canEditItem(v) && <button className={`btn-toggle ${v.disabled ? "btn-toggle--enable" : "btn-toggle--disable"}`} title={v.disabled ? "Enable" : "Disable"} onClick={() => handleToggleVacc(v._id)}>{v.disabled ? "✔" : "✖"}</button>}
                    {canEditItem(v) && pending && <button className="btn-del" title="Delete" onClick={() => handleDeleteVacc(v._id)}>🗑</button>}
                  </td>
                </tr>
                );
              })}
              {vaccines.filter((v) => {
                const q = vaccForm.Name.trim().toLowerCase();
                const pend = isWithin24h(v) && !v.disabled;
                if (statusFilter === "active" && (v.disabled || pend)) return false;
                if (statusFilter === "disabled" && !v.disabled) return false;
                if (statusFilter === "pending" && !pend) return false;
                return (!q || v.Name.toLowerCase().includes(q)) && filterByTime(v);
              }).length === 0 && <tr><td colSpan="8" className="admin-empty">{vaccForm.Name ? "No matching vaccines" : "No vaccine types"}</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── USERS TAB ─── */}
      {tab === "users" && canViewUsers && (
        <div className="admin-section">
          {/* Search filters */}
          <div className="admin-user-search">
            <div className="admin-user-search__field">
              <label className="admin-user-search__label">Name</label>
              <input
                type="text"
                placeholder="Search by name..."
                value={userSearchName}
                onChange={(e) => setUserSearchName(e.target.value)}
                className="admin-user-search__input"
              />
            </div>
            <div className="admin-user-search__field">
              <label className="admin-user-search__label">Email</label>
              <input
                type="text"
                placeholder="Search by email..."
                value={userSearchEmail}
                onChange={(e) => setUserSearchEmail(e.target.value)}
                className="admin-user-search__input"
              />
            </div>
            <div className="admin-user-search__field admin-user-search__field--role">
              <label className="admin-user-search__label">Role</label>
              <select
                value={userSearchRole}
                onChange={(e) => setUserSearchRole(e.target.value)}
                className="admin-user-search__select"
              >
                <option value="">All Roles</option>
                <option value="user">User</option>
                <option value="editor">Editor</option>
                <option value="sub-admin">Sub-Admin</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          {/* Edit form — admin only */}
          {isAdmin && editingUser && (
            <form className="admin-form" onSubmit={handleUserSubmit}>
              <input name="firstName" placeholder="First Name" value={userForm.firstName} onChange={handleUserChange} required />
              <input name="lastName" placeholder="Last Name" value={userForm.lastName} onChange={handleUserChange} required />
              <input name="email" type="email" placeholder="Email" value={userForm.email} onChange={handleUserChange} required />
              {!(editingUser && editingUser._id === sessionStorage.getItem("userId")) && (
                <select name="role" value={userForm.role} onChange={handleUserChange}>
                  <option value="user">User</option>
                  <option value="editor">Editor</option>
                  <option value="sub-admin">Sub-Admin</option>
                </select>
              )}
              <input name="password" type="password" placeholder="New Password (leave empty to keep)" value={userForm.password} onChange={handleUserChange} />
              <div className="admin-form-actions">
                <button type="button" className="btn-cancel" onClick={cancelEditUser}>Cancel</button>
                <button type="submit" className="btn-submit">Save Changes</button>
              </div>
            </form>
          )}
          {/* Reset password form — sub-admin and admin */}
          {resetPwUserId && (() => {
            const targetUser = users.find(u => u._id === resetPwUserId);
            return (
            <form className="admin-form" onSubmit={handleResetPassword}>
              <p className="admin-form-label">Reset password for <strong>{targetUser ? `${targetUser.firstName} ${targetUser.lastName}` : "user"}</strong></p>
              <input type="password" placeholder="Enter new password" value={resetPwValue} onChange={(e) => setResetPwValue(e.target.value)} required minLength={8} />
              <div className="admin-form-actions">
                <button type="button" className="btn-cancel" onClick={() => { setResetPwUserId(null); setResetPwValue(""); }}>Cancel</button>
                <button type="submit" className="btn-submit">Reset Password</button>
              </div>
            </form>
            );
          })()}
          <table className="admin-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Pets</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.filter((u) => {
                const nameQ = userSearchName.trim().toLowerCase();
                const emailQ = userSearchEmail.trim().toLowerCase();
                const roleQ = userSearchRole;
                const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
                if (nameQ && !fullName.includes(nameQ)) return false;
                if (emailQ && !u.email.toLowerCase().includes(emailQ)) return false;
                if (roleQ && (u.role || "user") !== roleQ) return false;
                return true;
              }).map((u) => (
                <React.Fragment key={u._id}>
                  <tr>
                    <td>{u.firstName} {u.lastName}</td>
                    <td>{u.email}</td>
                    <td>{u.role || "user"}</td>
                    <td>
                      <button
                        className={`btn-expand${expandedUser === u._id ? " btn-expand--open" : ""}`}
                        onClick={() => { setExpandedUser(expandedUser === u._id ? null : u._id); setExpandedPetVisits(null); setExpandedPetVaccines(null); }}
                        disabled={!u.pets || u.pets.length === 0}
                      >
                        <span className="btn-expand__icon">{expandedUser === u._id ? "▾" : "▸"}</span>
                        <span className="btn-expand__count">{u.pets ? u.pets.length : 0}</span>
                        <span className="btn-expand__label">{expandedUser === u._id ? "Hide" : "View"}</span>
                      </button>
                    </td>
                    <td className="admin-actions">
                      {/* Reset password — both admin and sub-admin */}
                      <button className="btn-edit" title="Reset password" onClick={() => { setResetPwUserId(u._id); setResetPwValue(""); }}>🔑</button>
                      {/* Edit / Delete / Pass role — admin only */}
                      {isAdmin && u._id !== sessionStorage.getItem("userId") && (
                        <>
                          <button className="btn-edit" title="Edit user" onClick={() => startEditUser(u)}>✎</button>
                          {(u.role || "user") !== "admin" && <button className="btn-del" title="Delete user" onClick={() => handleDeleteUser(u._id)}>🗑</button>}
                          {(u.role || "user") === "sub-admin" && <button className="btn-edit" title="Pass admin role" onClick={() => handlePassRole(u._id)}>👑</button>}
                        </>
                      )}
                    </td>
                  </tr>
                  {expandedUser === u._id && u.pets && u.pets.length > 0 && (
                    <tr className="user-pets-row">
                      <td colSpan="5">
                        <table className="admin-table admin-table--nested">
                          <thead>
                            <tr><th>Pet Name</th><th>Type</th><th>Breed</th><th>Gender</th><th>Birth Date</th><th>Visits</th><th>Vaccines</th></tr>
                          </thead>
                          <tbody>
                            {u.pets.map((p) => {
                              const vCount = p.vetVisits ? p.vetVisits.length : 0;
                              const vacCount = p.vaccines ? p.vaccines.length : 0;
                              return (
                                <React.Fragment key={p._id}>
                                  <tr>
                                    <td>{p.name}</td>
                                    <td>{p.type}</td>
                                    <td>{p.breed}</td>
                                    <td>{p.gender}</td>
                                    <td>{formatDate(p.birthDate)}</td>
                                    <td>
                                      <button
                                        className={`btn-expand btn-expand--sm${expandedPetVisits === p._id ? " btn-expand--open" : ""}`}
                                        onClick={() => setExpandedPetVisits(expandedPetVisits === p._id ? null : p._id)}
                                        disabled={vCount === 0}
                                      >
                                        <span className="btn-expand__icon">{expandedPetVisits === p._id ? "▾" : "▸"}</span>
                                        <span className="btn-expand__count">{vCount}</span>
                                      </button>
                                    </td>
                                    <td>
                                      <button
                                        className={`btn-expand btn-expand--sm${expandedPetVaccines === p._id ? " btn-expand--open" : ""}`}
                                        onClick={() => setExpandedPetVaccines(expandedPetVaccines === p._id ? null : p._id)}
                                        disabled={vacCount === 0}
                                      >
                                        <span className="btn-expand__icon">{expandedPetVaccines === p._id ? "▾" : "▸"}</span>
                                        <span className="btn-expand__count">{vacCount}</span>
                                      </button>
                                    </td>
                                  </tr>
                                  {expandedPetVisits === p._id && vCount > 0 && (
                                    <tr className="pet-detail-row">
                                      <td colSpan="7">
                                        <table className="admin-table admin-table--detail">
                                          <thead>
                                            <tr><th>Date</th><th>Reason</th><th>Veterinarian</th><th>Notes</th></tr>
                                          </thead>
                                          <tbody>
                                            {p.vetVisits.map((v, i) => (
                                              <tr key={i}>
                                                <td>{formatDate(v.date)}</td>
                                                <td>{v.reason}</td>
                                                <td>{v.veterinarian || "—"}</td>
                                                <td>{v.vetNotes || "—"}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </td>
                                    </tr>
                                  )}
                                  {expandedPetVaccines === p._id && vacCount > 0 && (
                                    <tr className="pet-detail-row">
                                      <td colSpan="7">
                                        <table className="admin-table admin-table--detail">
                                          <thead>
                                            <tr><th>Date</th><th>Vaccine Name</th></tr>
                                          </thead>
                                          <tbody>
                                            {p.vaccines.map((v, i) => (
                                              <tr key={i}>
                                                <td>{formatDate(v.date)}</td>
                                                <td>{v.vaccineName}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                  {expandedUser === u._id && (!u.pets || u.pets.length === 0) && (
                    <tr className="user-pets-row"><td colSpan="5" className="admin-empty">No pets</td></tr>
                  )}
                </React.Fragment>
              ))}
              {users.filter((u) => {
                const nameQ = userSearchName.trim().toLowerCase();
                const emailQ = userSearchEmail.trim().toLowerCase();
                const roleQ = userSearchRole;
                const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
                if (nameQ && !fullName.includes(nameQ)) return false;
                if (emailQ && !u.email.toLowerCase().includes(emailQ)) return false;
                if (roleQ && (u.role || "user") !== roleQ) return false;
                return true;
              }).length === 0 && <tr><td colSpan="5" className="admin-empty">{(userSearchName || userSearchEmail || userSearchRole) ? "No matching users" : "No users"}</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── PET TYPES TAB ─── */}
      {tab === "petTypes" && (
        <div className="admin-section">
          {canFilter && (
            <div className="admin-time-filter">
              <label>From:</label>
              <input type="date" value={dateFrom} max={dateTo || today} onChange={(e) => setDateFrom(e.target.value)} />
              <label>To:</label>
              <input type="date" value={dateTo} min={dateFrom || undefined} max={today} onChange={(e) => setDateTo(e.target.value)} />
              <button type="button" className="btn-clear-filter" onClick={() => { setDateFrom(""); setDateTo(""); }}>Clear</button>
              <span className="filter-separator"></span>
              <label>Status:</label>
              <select className="status-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          )}
          {!canFilter && (
            <div className="admin-time-filter">
              <label>Status:</label>
              <select className="status-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          )}
          <form className="admin-form" onSubmit={handlePtSubmit}>
            <input name="petType" placeholder="Search or add pet type..." value={ptForm.petType} onChange={handlePtChange} required />
            <div className="admin-form-actions">
              {editingPt && <button type="button" className="btn-cancel" onClick={cancelEditPt}>Cancel</button>}
              <button type="submit" className="btn-submit">{editingPt ? "Save Changes" : "Add Pet Type"}</button>
            </div>
          </form>
          <table className="admin-table">
            <thead>
              <tr>
                <SortTh col="petType">Pet Type</SortTh>
                <SortTh col="createdByName">Added By</SortTh>
                <SortTh col="createdAt">Date Added</SortTh>
                <SortTh col="disabled">Status</SortTh>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortData(petTypes
                .filter((pt) => {
                  const q = ptForm.petType.trim().toLowerCase();
                  const pend = isWithin24h(pt) && !pt.disabled;
                  if (statusFilter === "active" && (pt.disabled || pend)) return false;
                  if (statusFilter === "disabled" && !pt.disabled) return false;
                  if (statusFilter === "pending" && !pend) return false;
                  return (!q || pt.petType.toLowerCase().includes(q)) && filterByTime(pt);
                }))
                .map((pt) => {
                const pending = isWithin24h(pt) && !pt.disabled;
                return (
                <tr key={pt._id} className={pt.disabled ? "row-disabled" : ""}>
                  <td>{pt.petType}</td>
                  <td>{pt.createdByName || "Unknown"}</td>
                  <td>{formatDate(pt.createdAt)}</td>
                  <td><span className={`status-badge ${pt.disabled ? "status-badge--disabled" : pending ? "status-badge--pending" : "status-badge--active"}`}>{pt.disabled ? "Disabled" : pending ? "Pending" : "Active"}</span></td>
                  <td className="admin-actions">
                    {canEditItem(pt) && <button className="btn-edit" onClick={() => startEditPt(pt)}>✎</button>}
                    {canEditItem(pt) && <button className={`btn-toggle ${pt.disabled ? "btn-toggle--enable" : "btn-toggle--disable"}`} title={pt.disabled ? "Enable" : "Disable"} onClick={() => handleTogglePt(pt._id)}>{pt.disabled ? "✔" : "✖"}</button>}
                    {canEditItem(pt) && pending && <button className="btn-del" title="Delete" onClick={() => handleDeletePt(pt._id)}>🗑</button>}
                  </td>
                </tr>
                );
              })}
              {petTypes.filter((pt) => {
                const q = ptForm.petType.trim().toLowerCase();
                const pend = isWithin24h(pt) && !pt.disabled;
                if (statusFilter === "active" && (pt.disabled || pend)) return false;
                if (statusFilter === "disabled" && !pt.disabled) return false;
                if (statusFilter === "pending" && !pend) return false;
                return (!q || pt.petType.toLowerCase().includes(q)) && filterByTime(pt);
              }).length === 0 && <tr><td colSpan="5" className="admin-empty">{ptForm.petType ? "No matching pet types" : "No pet types"}</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── BREEDS TAB ─── */}
      {tab === "breeds" && (
        <div className="admin-section">
          {canFilter && (
            <div className="admin-time-filter">
              <label>From:</label>
              <input type="date" value={dateFrom} max={dateTo || today} onChange={(e) => setDateFrom(e.target.value)} />
              <label>To:</label>
              <input type="date" value={dateTo} min={dateFrom || undefined} max={today} onChange={(e) => setDateTo(e.target.value)} />
              <button type="button" className="btn-clear-filter" onClick={() => { setDateFrom(""); setDateTo(""); }}>Clear</button>
              <span className="filter-separator"></span>
              <label>Status:</label>
              <select className="status-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          )}
          {!canFilter && (
            <div className="admin-time-filter">
              <label>Status:</label>
              <select className="status-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          )}
          <form className="admin-form" onSubmit={handleBreedSubmit}>
            <input name="breed" placeholder="Search or add breed..." value={breedForm.breed} onChange={handleBreedChange} required />
            <select name="type" value={breedForm.type} onChange={handleBreedChange} required>
              <option value="">Select Pet Type</option>
              {petTypes.map((pt) => (
                <option key={pt._id} value={pt.petType}>{pt.petType}</option>
              ))}
            </select>
            <div className="admin-form-actions">
              {editingBreed && <button type="button" className="btn-cancel" onClick={cancelEditBreed}>Cancel</button>}
              <button type="submit" className="btn-submit">{editingBreed ? "Save Changes" : "Add Breed"}</button>
            </div>
          </form>
          <table className="admin-table">
            <thead>
              <tr>
                <SortTh col="breed">Breed</SortTh>
                <SortTh col="type">Pet Type</SortTh>
                <SortTh col="createdByName">Added By</SortTh>
                <SortTh col="createdAt">Date Added</SortTh>
                <SortTh col="disabled">Status</SortTh>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortData(breeds
                .filter((b) => {
                  const q = breedForm.breed.trim().toLowerCase();
                  const typeMatch = !breedForm.type || b.type === breedForm.type;
                  const nameMatch = !q || b.breed.toLowerCase().includes(q);
                  const pend = isWithin24h(b) && !b.disabled;
                  if (statusFilter === "active" && (b.disabled || pend)) return false;
                  if (statusFilter === "disabled" && !b.disabled) return false;
                  if (statusFilter === "pending" && !pend) return false;
                  return typeMatch && nameMatch && filterByTime(b);
                }))
                .map((b) => {
                const pending = isWithin24h(b) && !b.disabled;
                return (
                <tr key={b._id} className={b.disabled ? "row-disabled" : ""}>
                  <td>{b.breed}</td>
                  <td>{b.type}</td>
                  <td>{b.createdByName || "Unknown"}</td>
                  <td>{formatDate(b.createdAt)}</td>
                  <td><span className={`status-badge ${b.disabled ? "status-badge--disabled" : pending ? "status-badge--pending" : "status-badge--active"}`}>{b.disabled ? "Disabled" : pending ? "Pending" : "Active"}</span></td>
                  <td className="admin-actions">
                    {canEditItem(b) && <button className="btn-edit" onClick={() => startEditBreed(b)}>✎</button>}
                    {canEditItem(b) && <button className={`btn-toggle ${b.disabled ? "btn-toggle--enable" : "btn-toggle--disable"}`} title={b.disabled ? "Enable" : "Disable"} onClick={() => handleToggleBreed(b._id)}>{b.disabled ? "✔" : "✖"}</button>}
                    {canEditItem(b) && pending && <button className="btn-del" title="Delete" onClick={() => handleDeleteBreed(b._id)}>🗑</button>}
                  </td>
                </tr>
                );
              })}
              {breeds.filter((b) => {
                const q = breedForm.breed.trim().toLowerCase();
                const typeMatch = !breedForm.type || b.type === breedForm.type;
                const nameMatch = !q || b.breed.toLowerCase().includes(q);
                const pend = isWithin24h(b) && !b.disabled;
                if (statusFilter === "active" && (b.disabled || pend)) return false;
                if (statusFilter === "disabled" && !b.disabled) return false;
                if (statusFilter === "pending" && !pend) return false;
                return typeMatch && nameMatch && filterByTime(b);
              }).length === 0 && <tr><td colSpan="6" className="admin-empty">{breedForm.breed ? "No matching breeds" : "No breeds"}</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── USER STATISTICS TAB ─── */}
      {tab === "statistics" && canViewUsers && (
        <div className="admin-section">
          <div className="stats-toggle-bar">
            <label className="toggle-label">
              <input type="checkbox" checked={petsOnly} onChange={(e) => { setPetsOnly(e.target.checked); fetchStats(e.target.checked, statsFilters); }} />
              <span className="toggle-switch"></span>
              Show only users with pets
            </label>
            <button className={`stats-filter-toggle${activeFilterCount > 0 ? " stats-filter-toggle--active" : ""}`} onClick={() => setFiltersExpanded(e => !e)}>
              🔍 Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""} {filtersExpanded ? "▲" : "▼"}
            </button>
            {activeFilterCount > 0 && <button className="stats-filter-reset" onClick={resetStatsFilters}>✕ Reset</button>}
          </div>

          {/* ─── FILTER BAR ─── */}
          {filtersExpanded && statsFilterOptions && (() => {
            const filteredBreeds = statsFilters.petTypes.length > 0
              ? statsFilterOptions.breeds.filter(b => b.petTypes.some(t => statsFilters.petTypes.includes(t)))
              : statsFilterOptions.breeds;
            return (
            <div className="stats-filter-bar">
              {/* Pet Types */}
              <div className="stats-filter-group">
                <span className="stats-filter-group__label">🐾 Pet Type</span>
                <div className="stats-filter-chips">
                  {statsFilterOptions.petTypes.map(pt => (
                    <label key={pt} className={`filter-chip${statsFilters.petTypes.includes(pt) ? " filter-chip--active" : ""}`}>
                      <input type="checkbox" checked={statsFilters.petTypes.includes(pt)} onChange={() => toggleStatsFilter("petTypes", pt)} />
                      {pt}
                    </label>
                  ))}
                </div>
              </div>

              {/* Genders */}
              <div className="stats-filter-group">
                <span className="stats-filter-group__label">⚥ Gender</span>
                <div className="stats-filter-chips">
                  {statsFilterOptions.genders.map(g => (
                    <label key={g} className={`filter-chip${statsFilters.genders.includes(g) ? " filter-chip--active" : ""}`}>
                      <input type="checkbox" checked={statsFilters.genders.includes(g)} onChange={() => toggleStatsFilter("genders", g)} />
                      {g}
                    </label>
                  ))}
                </div>
              </div>

              {/* Breeds — filtered by selected pet types */}
              <div className="stats-filter-group">
                <span className="stats-filter-group__label">🏆 Breed</span>
                <div className="stats-filter-chips stats-filter-chips--scrollable">
                  {filteredBreeds.map(b => (
                    <label key={b.breed} className={`filter-chip${statsFilters.breeds.includes(b.breed) ? " filter-chip--active" : ""}`}>
                      <input type="checkbox" checked={statsFilters.breeds.includes(b.breed)} onChange={() => toggleStatsFilter("breeds", b.breed)} />
                      {b.breed}
                    </label>
                  ))}
                  {filteredBreeds.length === 0 && <span className="stats-filter-empty">No breeds for selected types</span>}
                </div>
              </div>

              {/* Cities */}
              <div className="stats-filter-group">
                <span className="stats-filter-group__label">🏙️ City</span>
                <div className="stats-filter-chips">
                  {statsFilterOptions.cities.map(c => (
                    <label key={c} className={`filter-chip${statsFilters.cities.includes(c) ? " filter-chip--active" : ""}`}>
                      <input type="checkbox" checked={statsFilters.cities.includes(c)} onChange={() => toggleStatsFilter("cities", c)} />
                      {c}
                    </label>
                  ))}
                </div>
              </div>

              {/* Vaccine Types */}
              <div className="stats-filter-group">
                <span className="stats-filter-group__label">💉 Vaccine</span>
                <div className="stats-filter-chips stats-filter-chips--scrollable">
                  {statsFilterOptions.vaccineNames.map(v => (
                    <label key={v} className={`filter-chip${statsFilters.vaccineNames.includes(v) ? " filter-chip--active" : ""}`}>
                      <input type="checkbox" checked={statsFilters.vaccineNames.includes(v)} onChange={() => toggleStatsFilter("vaccineNames", v)} />
                      {v}
                    </label>
                  ))}
                </div>
              </div>

              {/* Age Groups */}
              <div className="stats-filter-group">
                <span className="stats-filter-group__label">📅 Age Group</span>
                <div className="stats-filter-chips">
                  {statsFilterOptions.ageGroups.map(a => (
                    <label key={a} className={`filter-chip${statsFilters.ageGroups.includes(a) ? " filter-chip--active" : ""}`}>
                      <input type="checkbox" checked={statsFilters.ageGroups.includes(a)} onChange={() => toggleStatsFilter("ageGroups", a)} />
                      {a}
                    </label>
                  ))}
                </div>
              </div>

              {/* Activity Period (visits & vaccines) */}
              <div className="stats-filter-group">
                <span className="stats-filter-group__label">📆 Period</span>
                <div className="stats-filter-dates">
                  <label><span>From</span> <input type="date" value={statsFilters.periodFrom} max={statsFilters.periodTo || today} onChange={(e) => setStatsDateFilter("periodFrom", e.target.value)} /></label>
                  <label><span>To</span> <input type="date" value={statsFilters.periodTo} min={statsFilters.periodFrom} max={today} onChange={(e) => setStatsDateFilter("periodTo", e.target.value)} /></label>
                </div>
              </div>
            </div>
            );
          })()}
          {statsLoading && (
            <div className="loading-container"><div className="spinner"></div></div>
          )}
          {!statsLoading && stats && (() => {
            const { overview, petsByCity, petsPerVaccine, petsByType, petsByGender, petsByBreed, visitReasons, topOwners, monthlyPets, vaccineCoverage, visitsByCity, ageGroups } = stats;

            const sortedObj = (obj, limit) => {
              const entries = Object.entries(obj).sort((a, b) => b[1] - a[1]);
              return limit ? entries.slice(0, limit) : entries;
            };

            const maxVal = (entries) => Math.max(...entries.map(e => e[1]), 1);

            const PALETTE = ["#3b82f6","#8b5cf6","#ec4899","#f59e0b","#10b981","#06b6d4","#ef4444","#6366f1","#84cc16","#f97316","#14b8a6","#a855f7"];

            /* ── Horizontal Bar Chart (improved) ── */
            const BarChart = ({ entries, color = "#2d3e50", gradient }) => (
              <div className="stat-bars">
                {entries.map(([label, count], i) => (
                  <div key={label} className="stat-bar-row">
                    <span className="stat-bar-label" title={label}>{label}</span>
                    <div className="stat-bar-track">
                      <div className="stat-bar-fill" style={{ width: `${(count / maxVal(entries)) * 100}%`, background: gradient ? PALETTE[i % PALETTE.length] : color }}></div>
                    </div>
                    <span className="stat-bar-value">{count}</span>
                  </div>
                ))}
                {entries.length === 0 && <p className="admin-empty">No data</p>}
              </div>
            );

            /* ── Donut Chart (CSS conic-gradient) ── */
            const DonutChart = ({ entries, colors = PALETTE }) => {
              const total = entries.reduce((s, [, v]) => s + v, 0);
              if (total === 0) return <p className="admin-empty">No data</p>;
              let cum = 0;
              const segs = entries.map(([label, value], i) => {
                const pct = (value / total) * 100;
                const start = cum;
                cum += pct;
                return { label, value, pct, start, end: cum, color: colors[i % colors.length] };
              });
              const grad = segs.map(s => `${s.color} ${s.start}% ${s.end}%`).join(", ");
              return (
                <div className="donut-chart">
                  <div className="donut-chart__ring" style={{ background: `conic-gradient(${grad})` }}>
                    <div className="donut-chart__hole"><span className="donut-chart__total">{total}</span><span className="donut-chart__sub">total</span></div>
                  </div>
                  <div className="donut-chart__legend">
                    {segs.map(s => (
                      <div key={s.label} className="donut-chart__legend-item">
                        <span className="donut-chart__dot" style={{ background: s.color }}></span>
                        <span className="donut-chart__legend-text">{s.label}</span>
                        <span className="donut-chart__legend-val">{s.value} <small>({s.pct.toFixed(0)}%)</small></span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            };

            /* ── Column Chart (vertical bars for timeline) ── */
            const ColumnChart = ({ entries, color = "#3b82f6" }) => {
              const max = Math.max(...entries.map(e => e[1]), 1);
              if (entries.length === 0) return <p className="admin-empty">No data</p>;
              return (
                <div className="column-chart">
                  <div className="column-chart__bars">
                    {entries.map(([label, value]) => (
                      <div key={label} className="column-chart__col" title={`${label}: ${value}`}>
                        <span className="column-chart__val">{value || ""}</span>
                        <div className="column-chart__bar" style={{ height: `${(value / max) * 100}%`, background: color }}></div>
                        <span className="column-chart__label">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            };

            /* ── Progress List (percentage gauges) ── */
            const ProgressList = ({ items }) => {
              if (items.length === 0) return <p className="admin-empty">No vaccine types defined</p>;
              return (
                <div className="progress-list">
                  {items.map(item => (
                    <div key={item.name} className="progress-list__item">
                      <div className="progress-list__header">
                        <span className="progress-list__name" title={`${item.name} (${item.petTypes.join(", ")})`}>{item.name}</span>
                        <span className="progress-list__detail">{item.vaccinated} / {item.eligible}</span>
                      </div>
                      <div className="progress-list__row">
                        <div className="progress-list__track">
                          <div className="progress-list__fill" style={{ width: `${item.rate}%`, background: item.rate >= 50 ? "#10b981" : item.rate >= 25 ? "#f59e0b" : "#ef4444" }}></div>
                        </div>
                        <span className={`progress-list__pct ${item.rate >= 50 ? "progress-list__pct--good" : item.rate >= 25 ? "progress-list__pct--med" : "progress-list__pct--low"}`}>{item.rate}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            };

            /* ── Rank Table ── */
            const RankTable = ({ data, labelKey = "name", valueKey = "count", valueLabel = "Pets" }) => {
              if (data.length === 0) return <p className="admin-empty">No data</p>;
              const max = Math.max(...data.map(d => d[valueKey]), 1);
              return (
                <table className="rank-table">
                  <thead><tr><th>#</th><th>Owner</th><th>{valueLabel}</th><th></th></tr></thead>
                  <tbody>
                    {data.map((item, i) => (
                      <tr key={item[labelKey]}>
                        <td className="rank-table__rank">{i < 3 ? ["🥇","🥈","🥉"][i] : i + 1}</td>
                        <td className="rank-table__name">{item[labelKey]}</td>
                        <td className="rank-table__count">{item[valueKey]}</td>
                        <td className="rank-table__bar-cell"><div className="rank-table__bar" style={{ width: `${(item[valueKey] / max) * 100}%` }}></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            };

            return (
              <>
                {/* Overview Cards */}
                <div className="stats-overview">
                  <div className="stat-card stat-card--primary"><div className="stat-card__icon">👥</div><div className="stat-card__body"><div className="stat-card__value">{overview.totalUsers}</div><div className="stat-card__label">Total Users</div></div></div>
                  <div className="stat-card stat-card--info"><div className="stat-card__icon">🐾</div><div className="stat-card__body"><div className="stat-card__value">{overview.totalPets}</div><div className="stat-card__label">Total Pets</div></div></div>
                  <div className="stat-card stat-card--success"><div className="stat-card__icon">💉</div><div className="stat-card__body"><div className="stat-card__value">{overview.totalVaccinations}</div><div className="stat-card__label">Total Vaccinations</div></div></div>
                  <div className="stat-card stat-card--warning"><div className="stat-card__icon">🏥</div><div className="stat-card__body"><div className="stat-card__value">{overview.totalVisits}</div><div className="stat-card__label">Total Vet Visits</div></div></div>
                  <div className="stat-card stat-card--accent"><div className="stat-card__icon">📊</div><div className="stat-card__body"><div className="stat-card__value">{overview.vaccinationRate}%</div><div className="stat-card__label">Vaccination Rate</div></div></div>
                  <div className="stat-card stat-card--teal"><div className="stat-card__icon">📋</div><div className="stat-card__body"><div className="stat-card__value">{overview.avgVisitsPerPet}</div><div className="stat-card__label">Avg Visits / Pet</div></div></div>
                  <div className="stat-card stat-card--indigo"><div className="stat-card__icon">🔬</div><div className="stat-card__body"><div className="stat-card__value">{overview.avgVaccinesPerPet}</div><div className="stat-card__label">Avg Vaccines / Pet</div></div></div>
                </div>

                {/* Donut charts row */}
                <div className="stats-donuts-row">
                  <div className="stat-panel">
                    <h3 className="stat-panel__title">🐾 Pets by Type</h3>
                    <DonutChart entries={sortedObj(petsByType)} colors={["#8b5cf6","#3b82f6","#06b6d4","#10b981","#f59e0b","#ec4899","#ef4444","#6366f1"]} />
                  </div>
                  <div className="stat-panel">
                    <h3 className="stat-panel__title">⚥ Pets by Gender</h3>
                    <DonutChart entries={sortedObj(petsByGender)} colors={["#3b82f6","#ec4899","#94a3b8","#f59e0b"]} />
                  </div>
                  <div className="stat-panel">
                    <h3 className="stat-panel__title">📅 Pet Age Distribution</h3>
                    <DonutChart entries={Object.entries(ageGroups).filter(([, v]) => v > 0)} colors={["#fbbf24","#f97316","#ef4444","#8b5cf6","#6366f1","#3b82f6"]} />
                  </div>
                </div>

                <div className="stats-grid">
                  {/* Pets by City */}
                  <div className="stat-panel">
                    <h3 className="stat-panel__title">🏙️ Pets by City</h3>
                    <BarChart entries={sortedObj(petsByCity)} gradient />
                  </div>

                  {/* Pets Vaccinated per Vaccine */}
                  <div className="stat-panel">
                    <h3 className="stat-panel__title">💉 Pets Vaccinated per Vaccine</h3>
                    <BarChart entries={sortedObj(petsPerVaccine)} color="#10b981" />
                  </div>

                  {/* Vaccination Coverage */}
                  <div className="stat-panel stat-panel--wide">
                    <h3 className="stat-panel__title">📊 Vaccination Coverage by Vaccine Type</h3>
                    <ProgressList items={vaccineCoverage} />
                  </div>

                  {/* Top Breeds */}
                  <div className="stat-panel">
                    <h3 className="stat-panel__title">🏆 Top Breeds</h3>
                    <BarChart entries={sortedObj(petsByBreed, 15)} color="#06b6d4" />
                  </div>

                  {/* Top Visit Reasons */}
                  <div className="stat-panel">
                    <h3 className="stat-panel__title">🩺 Top Visit Reasons</h3>
                    <BarChart entries={sortedObj(visitReasons, 10)} color="#ef4444" />
                  </div>

                  {/* Visits by City */}
                  <div className="stat-panel">
                    <h3 className="stat-panel__title">📍 Vet Visits by City</h3>
                    <BarChart entries={sortedObj(visitsByCity)} color="#6366f1" />
                  </div>

                  {/* Top Pet Owners */}
                  <div className="stat-panel">
                    <h3 className="stat-panel__title">👤 Top Pet Owners</h3>
                    <RankTable data={topOwners} />
                  </div>

                  {/* Monthly Pet Registrations */}
                  <div className="stat-panel stat-panel--wide">
                    <h3 className="stat-panel__title">📈 Monthly Pet Registrations (Last 12 Months)</h3>
                    <ColumnChart entries={Object.entries(monthlyPets)} color="#3b82f6" />
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ─── ACTIVITY TAB ─── */}
      {tab === "activity" && canViewUsers && (
        <div className="admin-section">
          {activityLoading && (
            <div className="loading-container"><div className="spinner"></div></div>
          )}
          {!activityLoading && activity && (() => {
            const { users: staffList, overallTotals, byTarget } = activity;

            // Role filter (admin only)
            const filteredStaff = isAdmin
              ? staffList.filter(u => activityRoles.includes(u.role))
              : staffList;

            const actionLabels = { add: "Added", edit: "Edited", delete: "Deleted", enable: "Enabled", disable: "Disabled" };
            const actionColors = { add: "#10b981", edit: "#3b82f6", delete: "#ef4444", enable: "#8b5cf6", disable: "#f59e0b" };
            const targetLabels = { vaccine: "Vaccines", petType: "Pet Types", breed: "Breeds" };

            const totalActions = (t) => Object.values(t).reduce((s, v) => s + v, 0);

            const formatTs = (ts) => {
              const d = new Date(ts);
              return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
            };

            // Compute filtered totals
            const fTotals = { add: 0, edit: 0, delete: 0, enable: 0, disable: 0 };
            for (const u of filteredStaff) {
              for (const a of Object.keys(fTotals)) fTotals[a] += u.totals[a];
            }

            return (
              <>
                {/* Role filter — admin only */}
                {/* Filters row */}
                <div className="activity-filter-bar">
                  {isAdmin && (
                    <div className="activity-role-filter">
                      <span className="activity-role-filter__label">Show roles:</span>
                      {["editor", "sub-admin", "admin"].map(r => (
                        <label key={r} className={`pet-type-chip${activityRoles.includes(r) ? " pet-type-chip--active" : ""}`}>
                          <input type="checkbox" checked={activityRoles.includes(r)} onChange={() => setActivityRoles(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r])} />
                          {r.charAt(0).toUpperCase() + r.slice(1)}
                        </label>
                      ))}
                    </div>
                  )}
                  <div className="activity-period-filter">
                    <span className="activity-role-filter__label">Period:</span>
                    <div className="stats-filter-dates">
                      <label><span>From</span> <input type="date" value={activityPeriodFrom} max={activityPeriodTo || today} onChange={(e) => { setActivityPeriodFrom(e.target.value); fetchActivity(e.target.value, undefined); }} /></label>
                      <label><span>To</span> <input type="date" value={activityPeriodTo} min={activityPeriodFrom} max={today} onChange={(e) => { setActivityPeriodTo(e.target.value); fetchActivity(undefined, e.target.value); }} /></label>
                      {(activityPeriodFrom || activityPeriodTo) && (
                        <button className="stats-filter-reset" onClick={() => { setActivityPeriodFrom(""); setActivityPeriodTo(""); fetchActivity("", ""); }}>Clear</button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Overview Cards */}
                <div className="stats-overview">
                  <div className="stat-card stat-card--success"><div className="stat-card__value">{fTotals.add}</div><div className="stat-card__label">Items Added</div></div>
                  <div className="stat-card stat-card--primary"><div className="stat-card__value">{fTotals.edit}</div><div className="stat-card__label">Items Edited</div></div>
                  <div className="stat-card stat-card--warning"><div className="stat-card__value">{fTotals.disable}</div><div className="stat-card__label">Items Disabled</div></div>
                  <div className="stat-card stat-card--accent"><div className="stat-card__value">{fTotals.enable}</div><div className="stat-card__label">Items Enabled</div></div>
                  <div className="stat-card" style={{ borderTop: "3px solid #ef4444" }}><div className="stat-card__value">{fTotals.delete}</div><div className="stat-card__label">Items Deleted</div></div>
                  <div className="stat-card stat-card--info"><div className="stat-card__value">{filteredStaff.length}</div><div className="stat-card__label">Active Staff</div></div>
                </div>

                {/* Actions by Type breakdown */}
                <div className="stats-grid">
                  <div className="stat-panel">
                    <h3 className="stat-panel__title">📋 Actions by Type</h3>
                    <div className="stat-bars">
                      {Object.entries(fTotals).filter(([, v]) => v > 0).map(([action, count]) => (
                        <div key={action} className="stat-bar-row">
                          <span className="stat-bar-label">{actionLabels[action]}</span>
                          <div className="stat-bar-track">
                            <div className="stat-bar-fill" style={{ width: `${(count / Math.max(...Object.values(fTotals), 1)) * 100}%`, background: actionColors[action] }}></div>
                          </div>
                          <span className="stat-bar-value">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="stat-panel">
                    <h3 className="stat-panel__title">🗂️ Actions by Data Type</h3>
                    <div className="stat-bars">
                      {Object.entries(targetLabels).map(([key, label]) => {
                        const cnt = filteredStaff.reduce((s, u) => s + totalActions(u.byTarget[key] || {}), 0);
                        return (
                          <div key={key} className="stat-bar-row">
                            <span className="stat-bar-label">{label}</span>
                            <div className="stat-bar-track">
                              <div className="stat-bar-fill" style={{ width: `${cnt > 0 ? (cnt / Math.max(...Object.values(targetLabels).map((_, i) => filteredStaff.reduce((s2, u2) => s2 + totalActions(u2.byTarget[Object.keys(targetLabels)[i]] || {}), 0)), 1)) * 100 : 0}%`, background: "#2d3e50" }}></div>
                            </div>
                            <span className="stat-bar-value">{cnt}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Staff Performance Table */}
                <h3 className="activity-section-title">👥 Staff Performance</h3>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th style={{ color: "#86efac" }}>Added</th>
                      <th style={{ color: "#93c5fd" }}>Edited</th>
                      <th style={{ color: "#fcd34d" }}>Disabled</th>
                      <th style={{ color: "#c4b5fd" }}>Enabled</th>
                      <th style={{ color: "#fca5a5" }}>Deleted</th>
                      <th>Total</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStaff
                      .sort((a, b) => totalActions(b.totals) - totalActions(a.totals))
                      .map(u => (
                      <React.Fragment key={u._id}>
                        <tr>
                          <td>{u.name}</td>
                          <td><span className={`role-badge role-badge--${u.role}`}>{u.role}</span></td>
                          <td>{u.totals.add || 0}</td>
                          <td>{u.totals.edit || 0}</td>
                          <td>{u.totals.disable || 0}</td>
                          <td>{u.totals.enable || 0}</td>
                          <td>{u.totals.delete || 0}</td>
                          <td><strong>{totalActions(u.totals)}</strong></td>
                          <td>
                            <button
                              className={`btn-expand btn-expand--sm${expandedStaff === u._id ? " btn-expand--open" : ""}`}
                              onClick={() => setExpandedStaff(expandedStaff === u._id ? null : u._id)}
                              disabled={totalActions(u.totals) === 0}
                            >
                              <span className="btn-expand__icon">{expandedStaff === u._id ? "▾" : "▸"}</span>
                              <span className="btn-expand__count">{totalActions(u.totals)}</span>
                            </button>
                          </td>
                        </tr>
                        {expandedStaff === u._id && (
                          <tr className="user-pets-row">
                            <td colSpan="9">
                              <div className="activity-detail-grid">
                                {/* Breakdown by target */}
                                <div className="activity-detail-box">
                                  <h4>By Data Type</h4>
                                  <table className="admin-table admin-table--detail">
                                    <thead><tr><th>Type</th><th>Add</th><th>Edit</th><th>Disable</th><th>Enable</th><th>Delete</th></tr></thead>
                                    <tbody>
                                      {Object.entries(targetLabels).map(([key, label]) => (
                                        <tr key={key}>
                                          <td>{label}</td>
                                          <td>{u.byTarget[key]?.add || 0}</td>
                                          <td>{u.byTarget[key]?.edit || 0}</td>
                                          <td>{u.byTarget[key]?.disable || 0}</td>
                                          <td>{u.byTarget[key]?.enable || 0}</td>
                                          <td>{u.byTarget[key]?.delete || 0}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                {/* Recent actions */}
                                <div className="activity-detail-box">
                                  <h4>Recent Actions</h4>
                                  <table className="admin-table admin-table--detail">
                                    <thead><tr><th>Time</th><th>Action</th><th>Type</th><th>Name</th></tr></thead>
                                    <tbody>
                                      {u.recentActions.map((a, i) => (
                                        <tr key={i}>
                                          <td>{formatTs(a.timestamp)}</td>
                                          <td><span className="action-chip" style={{ background: actionColors[a.action] + "22", color: actionColors[a.action] }}>{actionLabels[a.action]}</span></td>
                                          <td>{targetLabels[a.target] || a.target}</td>
                                          <td>{a.targetName}</td>
                                        </tr>
                                      ))}
                                      {u.recentActions.length === 0 && <tr><td colSpan="4" className="admin-empty">No recent activity</td></tr>}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                    {filteredStaff.length === 0 && <tr><td colSpan="9" className="admin-empty">No staff for selected roles</td></tr>}
                  </tbody>
                </table>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
