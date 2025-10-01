const express = require('express');
const cors = require('cors');
const { User, Application } = require('./models');
// Impor fungsi migrasi kita
const { runMigrations } = require('./db/runMigrations');

const app = express();

const allowedOrigins = [
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'https://auly-job-tracker-app.vercel.app'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Izinkan request tanpa origin (Postman, curl, dll) atau dari origin yang diizinkan
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Tambahkan ini untuk mengizinkan credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Izinkan method yang digunakan
  allowedHeaders: ['Content-Type', 'Authorization'] // Header yang diizinkan
};

app.use(cors(corsOptions));
app.use(express.json());

// --- OTENTIKASI ---
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }
    try {
        const existingUser = await User.findOne({ where: { username: username } });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists.' });
        }
        const newUser = await User.create({ username, password });
        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create user.' });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ where: { username: username } });
        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }
        const userData = { id: user.id, username: user.username };
        res.status(200).json({ message: 'Login successful!', user: userData });
    } catch (error) {
        res.status(500).json({ error: 'Server error during login.' });
    }
});


// --- CRUD UNTUK APPLICATIONS ---

// GET: Mengambil semua lamaran milik seorang user
app.get('/api/applications/user/:userId', async (req, res) => {
    try {
        const applications = await Application.findAll({
            where: { userId: req.params.userId },
            order: [['applicationDate', 'DESC']]
        });
        res.status(200).json(applications);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch applications.' });
    }
});

// POST: Membuat lamaran baru
app.post('/api/applications', async (req, res) => {
    try {
        const newApplication = await Application.create(req.body);
        res.status(201).json(newApplication);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create application.' });
    }
});

// PUT: Mengupdate lamaran yang ada
app.put('/api/applications/:id', async (req, res) => {
    try {
        const application = await Application.findByPk(req.params.id);
        if (application) {
            await application.update(req.body);
            res.status(200).json(application);
        } else {
            res.status(404).json({ error: 'Application not found.' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update application.' });
    }
});

// DELETE: Menghapus satu lamaran spesifik
app.delete('/api/applications/:id', async (req, res) => {
    try {
        const application = await Application.findByPk(req.params.id);
        if (application) {
            await application.destroy();
            res.status(204).send();
        } else {
            res.status(404).json({ error: 'Application not found.' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete application.' });
    }
});


// DELETE: Menghapus SEMUA lamaran milik seorang user
app.delete('/api/applications/user/:userId', async (req, res) => {
    try {
        await Application.destroy({
            where: { userId: req.params.userId }
        });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to clear all applications.' });
    }
});


// Fungsi untuk memulai server
const startServer = async () => {
  // 1. Jalankan migrasi terlebih dahulu
  await runMigrations();

  // 2. Jika migrasi berhasil, baru jalankan server Express
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server berhasil berjalan di port ${PORT}`);
  });
};

// Panggil fungsi untuk memulai semuanya
startServer();