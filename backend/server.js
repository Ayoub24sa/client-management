const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("./lib/prisma");

require("dotenv").config({
  path: __dirname + "/.env",
});

const app = express();
const PORT = 5000;

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("JWT_SECRET is missing from .env");
  process.exit(1);
}

app.use(cors());
app.use(express.json());

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      error: "Accès non autorisé",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      error: "Token invalide ou expiré",
    });
  }
};

/* =========================
   VALIDATION CLIENT
========================= */

const validateClient = ({
  nom,
  prenom,
  email,
  telephone,
  entreprise,
  statut,
}) => {
  const errors = {};

  if (!nom || !nom.trim()) {
    errors.nom = "Le nom est obligatoire";
  }

  if (!prenom || !prenom.trim()) {
    errors.prenom = "Le prénom est obligatoire";
  }

  if (!email || !email.trim()) {
    errors.email = "L'email est obligatoire";
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      errors.email = "L'email n'est pas valide";
    }
  }

  if (!telephone || !telephone.trim()) {
    errors.telephone = "Le téléphone est obligatoire";
  }

  if (!entreprise || !entreprise.trim()) {
    errors.entreprise = "L'entreprise est obligatoire";
  }

  const allowedStatuses = [
    "Prospect",
    "Client",
    "Inactif",
  ];

  if (!allowedStatuses.includes(statut)) {
    errors.statut = "Le statut n'est pas valide";
  }

  return errors;
};

/* =========================
   ROUTE PRINCIPALE
========================= */

app.get("/", (req, res) => {
  res.json({
    message: "Client Management API is running",
  });
});

/* =========================
   REGISTER
========================= */

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Tous les champs sont obligatoires",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error:
          "Le mot de passe doit contenir au moins 6 caractères",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        error: "Cet email est déjà utilisé",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    res.status(201).json({
      message: "Compte créé avec succès",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erreur lors de la création du compte",
    });
  }
});

/* =========================
   LOGIN
========================= */

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email et mot de passe sont obligatoires",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        error: "Email ou mot de passe incorrect",
      });
    }

    const passwordIsValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordIsValid) {
      return res.status(401).json({
        error: "Email ou mot de passe incorrect",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      JWT_SECRET,
      {
        expiresIn: "2h",
      }
    );

    res.json({
      message: "Connexion réussie",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erreur lors de la connexion",
    });
  }
});

/* =========================
   GET CLIENTS
========================= */

app.get(
  "/api/clients",
  authenticateToken,
  async (req, res) => {
    try {
      const clients = await prisma.client.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });

      res.json(clients);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: "Erreur lors de la récupération des clients",
      });
    }
  }
);

/* =========================
   CREATE CLIENT
========================= */

app.post(
  "/api/clients",
  authenticateToken,
  async (req, res) => {
    try {
      const {
        nom,
        prenom,
        email,
        telephone,
        entreprise,
        statut,
      } = req.body;

      const errors = validateClient({
        nom,
        prenom,
        email,
        telephone,
        entreprise,
        statut,
      });

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({
          error: "Données invalides",
          details: errors,
        });
      }

      const existingClient = await prisma.client.findUnique({
        where: {
          email,
        },
      });

      if (existingClient) {
        return res.status(409).json({
          error: "Un client avec cet email existe déjà",
        });
      }

      const client = await prisma.client.create({
        data: {
          nom: nom.trim(),
          prenom: prenom.trim(),
          email: email.trim(),
          telephone: telephone.trim(),
          entreprise: entreprise.trim(),
          statut,
        },
      });

      res.status(201).json(client);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: "Erreur lors de la création du client",
      });
    }
  }
);

/* =========================
   UPDATE CLIENT
========================= */

app.put(
  "/api/clients/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (Number.isNaN(id)) {
        return res.status(400).json({
          error: "ID client invalide",
        });
      }

      const {
        nom,
        prenom,
        email,
        telephone,
        entreprise,
        statut,
      } = req.body;

      const errors = validateClient({
        nom,
        prenom,
        email,
        telephone,
        entreprise,
        statut,
      });

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({
          error: "Données invalides",
          details: errors,
        });
      }

      const existingClient = await prisma.client.findFirst({
        where: {
          email,
          NOT: {
            id,
          },
        },
      });

      if (existingClient) {
        return res.status(409).json({
          error: "Un autre client utilise déjà cet email",
        });
      }

      const client = await prisma.client.update({
        where: {
          id,
        },
        data: {
          nom: nom.trim(),
          prenom: prenom.trim(),
          email: email.trim(),
          telephone: telephone.trim(),
          entreprise: entreprise.trim(),
          statut,
        },
      });

      res.json(client);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: "Erreur lors de la modification du client",
      });
    }
  }
);

/* =========================
   DELETE CLIENT
========================= */

app.delete(
  "/api/clients/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (Number.isNaN(id)) {
        return res.status(400).json({
          error: "ID client invalide",
        });
      }

      await prisma.client.delete({
        where: {
          id,
        },
      });

      res.json({
        message: "Client supprimé avec succès",
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: "Erreur lors de la suppression du client",
      });
    }
  }
);

/* =========================
   START SERVER
========================= */

app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
});