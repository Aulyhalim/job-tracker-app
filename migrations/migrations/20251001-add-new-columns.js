'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // 1. Tambahkan kolom 'email' ke tabel Users
    await queryInterface.addColumn('Users', 'email', {
      type: Sequelize.STRING,
      allowNull: false, // Tambahkan batasan not null
      unique: true // Tambahkan batasan unik
    });

    // 2. Tambahkan kolom baru ke tabel Applications
    await queryInterface.addColumn('Applications', 'expectedSalary', {
      type: Sequelize.INTEGER,
      allowNull: true // Bisa null jika belum ada negosiasi gaji
    });
    await queryInterface.addColumn('Applications', 'source', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('Applications', 'interviewDate', {
      type: Sequelize.DATEONLY, // DATEONLY karena hanya tanggal
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