const express = require('express');
const cors = require('cors'); // <-- TAMBAHKAN BARIS INI
const { User, Application } = require('./models');

const app = express();

app.use(cors()); // <-- TAMBAHKAN BARIS INI
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

app.listen(3000, () => console.log('Server berjalan di port 3000'));