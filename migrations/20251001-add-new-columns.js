'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // 1. Tambahkan kolom 'email' ke tabel Users
    console.log("Menambahkan kolom 'email' ke tabel Users...");
    await queryInterface.addColumn('Users', 'email', {
      type: Sequelize.STRING,
      allowNull: false, // Sesuai dengan model user.js
      unique: true // Sesuai dengan model user.js
    });

    // 2. Tambahkan kolom baru ke tabel Applications
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
      type: Sequelize.DATEONLY, // DATEONLY untuk tanggal tanpa waktu
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    // Menghapus kolom jika terjadi rollback
    await queryInterface.removeColumn('Users', 'email');
    await queryInterface.removeColumn('Applications', 'expectedSalary');
    await queryInterface.removeColumn('Applications', 'source');
    await queryInterface.removeColumn('Applications', 'interviewDate');
  }
};