import { useState } from "react";

function Auth({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const endpoint = isRegister
        ? "http://localhost:5000/api/auth/register"
        : "http://localhost:5000/api/auth/login";

      const body = isRegister
        ? {
            name: form.name,
            email: form.email,
            password: form.password,
          }
        : {
            email: form.email,
            password: form.password,
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Une erreur est survenue");
        return;
      }

      if (isRegister) {
        setIsRegister(false);

        setForm({
          name: "",
          email: "",
          password: "",
        });

        alert("Compte créé avec succès. Vous pouvez maintenant vous connecter.");
      } else {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        onLogin(data.user);
      }
    } catch (error) {
      console.error(error);
      setError("Impossible de contacter le serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Client Management</h1>

          <p>
            {isRegister
              ? "Créer votre compte"
              : "Connectez-vous à votre compte"}
          </p>
        </div>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label>Nom</label>

              <input
                name="name"
                type="text"
                placeholder="Votre nom"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
          )}

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
            <label>Mot de passe</label>

            <input
              name="password"
              type="password"
              placeholder="Minimum 6 caractères"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            className="btn btn-primary auth-button"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Chargement..."
              : isRegister
              ? "Créer mon compte"
              : "Se connecter"}
          </button>
        </form>

        <div className="auth-switch">
          {isRegister
            ? "Vous avez déjà un compte ?"
            : "Vous n'avez pas encore de compte ?"}

          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
            }}
          >
            {isRegister
              ? "Se connecter"
              : "Créer un compte"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Auth;