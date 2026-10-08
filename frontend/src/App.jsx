import { useEffect, useState } from "react";
import "./App.css";
import Auth from "./Auth";

function App() {
  const [user, setUser] = useState(null);

  const [clients, setClients] = useState([]);

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    entreprise: "",
    statut: "Prospect",
  });

  const [editingId, setEditingId] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");

  /* =========================
     CHECK USER
  ========================= */

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  /* =========================
     LOAD CLIENTS
  ========================= */

  useEffect(() => {
    if (user) {
      loadClients();
    }
  }, [user]);

  const loadClients = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/clients",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleLogout();
          return;
        }

        alert(data.error || "Erreur lors du chargement des clients");
        return;
      }

      setClients(data);
    } catch (error) {
      console.error(error);
      alert("Impossible de contacter le serveur");
    }
  };

  /* =========================
     LOGIN
  ========================= */

  const handleLogin = (loggedUser) => {
    setUser(loggedUser);
  };

  /* =========================
     LOGOUT
  ========================= */

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setClients([]);
    setSelectedClient(null);

    resetForm();
  };

  /* =========================
     FORM CHANGE
  ========================= */

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  /* =========================
     CREATE / UPDATE CLIENT
  ========================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const token = localStorage.getItem("token");

      const url = editingId
        ? `http://localhost:5000/api/clients/${editingId}`
        : "http://localhost:5000/api/clients";

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleLogout();
          return;
        }

        alert(data.error || "Une erreur est survenue");
        return;
      }

      if (editingId) {
        setClients(
          clients.map((client) =>
            client.id === editingId ? data : client
          )
        );

        if (selectedClient?.id === editingId) {
          setSelectedClient(data);
        }
      } else {
        setClients([data, ...clients]);
      }

      resetForm();
    } catch (error) {
      console.error(error);
      alert("Impossible de contacter le serveur");
    }
  };

  /* =========================
     EDIT CLIENT
  ========================= */

  const handleEdit = (client) => {
    setEditingId(client.id);

    setForm({
      nom: client.nom,
      prenom: client.prenom,
      email: client.email,
      telephone: client.telephone,
      entreprise: client.entreprise,
      statut: client.statut,
    });

    setSelectedClient(null);
  };

  /* =========================
     DELETE CLIENT
  ========================= */

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer ce client ?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/clients/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleLogout();
          return;
        }

        alert(data.error || "Erreur lors de la suppression");
        return;
      }

      setClients(
        clients.filter((client) => client.id !== id)
      );

      if (selectedClient?.id === id) {
        setSelectedClient(null);
      }
    } catch (error) {
      console.error(error);
      alert("Impossible de contacter le serveur");
    }
  };

  /* =========================
     RESET FORM
  ========================= */

  const resetForm = () => {
    setEditingId(null);

    setForm({
      nom: "",
      prenom: "",
      email: "",
      telephone: "",
      entreprise: "",
      statut: "Prospect",
    });
  };

  /* =========================
     SEARCH + FILTER
  ========================= */

  const filteredClients = clients.filter((client) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      client.nom.toLowerCase().includes(searchText) ||
      client.prenom.toLowerCase().includes(searchText) ||
      client.email.toLowerCase().includes(searchText) ||
      client.entreprise.toLowerCase().includes(searchText);

    const matchesStatus =
      statusFilter === "Tous" ||
      client.statut === statusFilter;

    return matchesSearch && matchesStatus;
  });

  /* =========================
     DASHBOARD STATS
  ========================= */

  const totalClients = clients.length;

  const prospects = clients.filter(
    (client) => client.statut === "Prospect"
  ).length;

  const activeClients = clients.filter(
    (client) => client.statut === "Client"
  ).length;

  /* =========================
     AUTH PAGE
  ========================= */

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  /* =========================
     CLIENT DETAIL
  ========================= */

  if (selectedClient) {
    return (
      <div className="app">
        <header className="topbar">
          <div>
            <h1>Client Management</h1>
            <p>Gestion de vos clients</p>
          </div>

          <div className="user-area">
            <span>
              Bonjour, <strong>{user.name}</strong>
            </span>

            <button
              className="btn btn-secondary"
              onClick={handleLogout}
            >
              Déconnexion
            </button>
          </div>
        </header>

        <main className="container">
          <button
            className="btn btn-secondary"
            onClick={() => setSelectedClient(null)}
          >
            ← Retour à la liste
          </button>

          <div className="detail-card">
            <div className="detail-header">
              <div>
                <h2>
                  {selectedClient.prenom}{" "}
                  {selectedClient.nom}
                </h2>

                <span
                  className={`status ${selectedClient.statut.toLowerCase()}`}
                >
                  {selectedClient.statut}
                </span>
              </div>
            </div>

            <div className="detail-grid">
              <div>
                <span className="detail-label">
                  Email
                </span>

                <p>{selectedClient.email}</p>
              </div>

              <div>
                <span className="detail-label">
                  Téléphone
                </span>

                <p>{selectedClient.telephone}</p>
              </div>

              <div>
                <span className="detail-label">
                  Entreprise
                </span>

                <p>{selectedClient.entreprise}</p>
              </div>

              <div>
                <span className="detail-label">
                  Date de création
                </span>

                <p>
                  {new Date(
                    selectedClient.dateCreation
                  ).toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>

            <div className="detail-actions">
              <button
                className="btn btn-primary"
                onClick={() =>
                  handleEdit(selectedClient)
                }
              >
                Modifier
              </button>

              <button
                className="btn btn-danger"
                onClick={() =>
                  handleDelete(selectedClient.id)
                }
              >
                Supprimer
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* =========================
     MAIN DASHBOARD
  ========================= */

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>Client Management</h1>
          <p>Gestion de vos clients</p>
        </div>

        <div className="user-area">
          <span>
            Bonjour, <strong>{user.name}</strong>
          </span>

          <button
            className="btn btn-secondary"
            onClick={handleLogout}
          >
            Déconnexion
          </button>
        </div>
      </header>

      <main className="container">
        {/* =========================
            DASHBOARD
        ========================= */}

        <section>
          <div className="section-header">
            <div>
              <h2>Dashboard</h2>

              <p className="section-description">
                Vue d'ensemble de votre activité
              </p>
            </div>
          </div>

          <div className="dashboard-grid">
            <div className="stat-card">
              <div className="stat-icon">👥</div>

              <div>
                <p>Total clients</p>
                <h3>{totalClients}</h3>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🎯</div>

              <div>
                <p>Prospects</p>
                <h3>{prospects}</h3>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">✓</div>

              <div>
                <p>Clients actifs</p>
                <h3>{activeClients}</h3>
              </div>
            </div>
          </div>
        </section>

        {/* =========================
            ADD / EDIT CLIENT
        ========================= */}

        <section className="form-section">
          <div className="section-header">
            <div>
              <h2>
                {editingId
                  ? "Modifier le client"
                  : "Ajouter un client"}
              </h2>

              <p className="section-description">
                {editingId
                  ? "Modifiez les informations du client"
                  : "Ajoutez un nouveau client"}
              </p>
            </div>
          </div>

          <form
            className="client-form"
            onSubmit={handleSubmit}
          >
            <div className="form-group">
              <label>Nom</label>

              <input
                name="nom"
                placeholder="Nom"
                value={form.nom}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Prénom</label>

              <input
                name="prenom"
                placeholder="Prénom"
                value={form.prenom}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>

              <input
                name="email"
                type="email"
                placeholder="exemple@email.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Téléphone</label>

              <input
                name="telephone"
                placeholder="+212 ..."
                value={form.telephone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Entreprise</label>

              <input
                name="entreprise"
                placeholder="Nom de l'entreprise"
                value={form.entreprise}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Statut</label>

              <select
                name="statut"
                value={form.statut}
                onChange={handleChange}
              >
                <option value="Prospect">
                  Prospect
                </option>

                <option value="Client">
                  Client
                </option>

                <option value="Inactif">
                  Inactif
                </option>
              </select>
            </div>

            <div className="form-actions">
              <button
                className="btn btn-primary"
                type="submit"
              >
                {editingId
                  ? "Enregistrer"
                  : "Ajouter le client"}
              </button>

              {editingId && (
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={resetForm}
                >
                  Annuler
                </button>
              )}
            </div>
          </form>
        </section>

        {/* =========================
            CLIENT LIST
        ========================= */}

        <section className="clients-section">
          <div className="section-header">
            <div>
              <h2>Liste des clients</h2>

              <p className="section-description">
                Consultez et gérez vos clients
              </p>
            </div>
          </div>

          <div className="toolbar">
            <input
              className="search-input"
              type="text"
              placeholder="🔍 Rechercher un client..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

            <select
              className="filter-select"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
            >
              <option value="Tous">
                Tous les statuts
              </option>

              <option value="Prospect">
                Prospect
              </option>

              <option value="Client">
                Client
              </option>

              <option value="Inactif">
                Inactif
              </option>
            </select>
          </div>

          <div className="table-wrapper">
            <table className="clients-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>Entreprise</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredClients.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <button
                        className="client-name"
                        onClick={() =>
                          setSelectedClient(client)
                        }
                      >
                        {client.prenom} {client.nom}
                      </button>
                    </td>

                    <td>{client.email}</td>

                    <td>{client.telephone}</td>

                    <td>{client.entreprise}</td>

                    <td>
                      <span
                        className={`status ${client.statut.toLowerCase()}`}
                      >
                        {client.statut}
                      </span>
                    </td>

                    <td>
                      <div className="table-actions">
                        <button
                          className="btn-small btn-edit"
                          onClick={() =>
                            handleEdit(client)
                          }
                        >
                          Modifier
                        </button>

                        <button
                          className="btn-small btn-delete"
                          onClick={() =>
                            handleDelete(client.id)
                          }
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredClients.length === 0 && (
              <div className="empty-state">
                <p>Aucun client trouvé.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;