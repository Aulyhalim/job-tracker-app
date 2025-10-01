'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // 1. TAMBAH KOLOM EMAIL SEBAGAI NULLABLE DULU
    console.log("Tahap 1: Menambahkan kolom 'email' (nullable) ke tabel Users...");
    await queryInterface.addColumn('Users', 'email', {
      type: Sequelize.STRING,
      allowNull: true // Biarkan Null dulu!
    });

    // 2. ISI SEMUA BARIS LAMA DENGAN NILAI UNIK SEMENTARA
    // Kita set email = username + ID agar pasti unik
    console.log("Tahap 2: Mengisi kolom 'email' yang kosong dengan nilai unik sementara...");
    await queryInterface.sequelize.query(
      `UPDATE Users SET email = CONCAT(username, id, '@temp.com') WHERE email IS NULL;`
    );

    // 3. TAMBAHKAN BATASAN NOT NULL DAN UNIQUE
    console.log("Tahap 3: Menambahkan batasan NOT NULL dan UNIQUE...");
    await queryInterface.changeColumn('Users', 'email', {
      type: Sequelize.STRING,
      allowNull: false, // Terapkan NOT NULL
      unique: true      // Terapkan UNIQUE
    });

    // 4. Tambahkan kolom baru ke tabel Applications
    console.log("Menambahkan kolom baru ke tabel Applications...");
    await queryInterface.addColumn('Applications', 'expectedSalary', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    await queryInterface.addColumn('Applications', 'source', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('Applications', 'interviewDate', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    // Menghapus kolom jika rollback
    await queryInterface.removeColumn('Users', 'email');
    await queryInterface.removeColumn('Applications', 'expectedSalary');
    await queryInterface.removeColumn('Applications', 'source');
    await queryInterface.removeColumn('Applications', 'interviewDate');
  }
};