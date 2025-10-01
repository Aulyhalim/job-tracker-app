const { Umzug, SequelizeStorage } = require('umzug');
const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

// Inisialisasi Sequelize menggunakan DATABASE_URL dari Railway
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'mysql',
  dialectOptions: {
    connectTimeout: 60000 // Timeout 60 detik
  },
  logging: console.log, // Tampilkan log query untuk debugging
});

const umzug = new Umzug({
  migrations: {
    glob: path.join(__dirname, '../migrations/*.js'),
    resolve: ({ name, path, context }) => {
      const migration = require(path);
      return {
        name,
        up: async () => migration.up(context, Sequelize),
        down: async () => migration.down(context, Sequelize),
      };
    },
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

// Fungsi yang akan kita panggil untuk menjalankan migrasi
const runMigrations = async () => {
  try {
    console.log('Mengecek migrasi yang tertunda...');
    const pendingMigrations = await umzug.pending();

    if (pendingMigrations.length > 0) {
      console.log('Migrasi tertunda ditemukan, menjalankan sekarang...');
      await umzug.up();
      console.log('Semua migrasi berhasil dijalankan.');
    } else {
      console.log('Database sudah terbaru.');
    }
  } catch (error) {
    console.error('Gagal menjalankan migrasi:', error);
    process.exit(1); // Hentikan aplikasi jika migrasi gagal
  }
};

module.exports = { runMigrations, sequelize };