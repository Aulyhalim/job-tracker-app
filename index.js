const express = require('express');
const cors = require('cors');
// Pastikan Sequelize diimpor bersama User dan Application
const { User, Application, Sequelize } = require('./models'); 
const { runMigrations } = require('./db/runMigrations');

const app = express();

// SOLUSI: Konfigurasi CORS yang lebih ketat dan benar
app.use(cors({
  origin: function (origin, callback) {
    // Daftar origin yang diizinkan
    const allowedOrigins = [
      'http://127.0.0.1:5500',
      'http://localhost:5500',
      'https://auly-job-tracker-app.vercel.app'
    ];
    
    // Izinkan jika:
    // 1. Tidak ada origin (terjadi pada beberapa Postman/cURL/file:///)
    // 2. Origin ada di daftar allowedOrigins
    // 3. Origin berasal dari vercel.app (untuk preview deployments)
    if (!origin || 
        allowedOrigins.includes(origin) || 
        origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      // Tolak permintaan dari origin lain
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'] // Tambah header yang umum
}));

app.use(express.json());

// Tambahkan endpoint test untuk memastikan server berjalan
app.get('/', (req, res) => {
  res.json({ message: 'Job Tracker API is running!' });
});

// --- OTENTIKASI ---
app.post('/register', async (req, res) => {
    // MENANGKAP KOLOM EMAIL YANG BARU
    const { username, password, email } = req.body; 
    
    if (!username || !password || !email) { // VALIDASI EMAIL
        return res.status(400).json({ error: 'Username, email, and password are required.' });
    }
    try {
        // Cek: apakah username ATAU email sudah ada menggunakan Op.or dari Sequelize
        const existingUser = await User.findOne({ 
            where: { 
                [Sequelize.Op.or]: [{ username: username }, { email: email }]
            } 
        });
        
        if (existingUser) {
            return res.status(400).json({ error: 'Username or email already exists.' });
        }
        // MEMBUAT USER BARU DENGAN EMAIL
        const newUser = await User.create({ username, password, email });
        res.status(201).json(newUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create user.' });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const user = await User.findOne({ where: { username: username } });
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }
        
        if (user.password !== password) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }
        
        // PENTING: Pastikan struktur response sesuai dengan yang diharapkan frontend
        const userData = { 
            id: user.id, 
            username: user.username 
        };
        
        res.status(200).json({ 
            message: 'Login successful!', 
            user: userData 
        });
    } catch (error) {
        console.error('Login error:', error);
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
        // Pastikan model sudah diperbarui untuk menerima expectedSalary, source, interviewDate
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


const startServer = async () => {
  await runMigrations();

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {  // ← Tambahkan '0.0.0.0'
    console.log(`Server berhasil berjalan di port ${PORT}`);
  });
};

startServer();