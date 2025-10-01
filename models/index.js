'use strict';

const fs = require('fs');
const path = require('path');
// PENTING: Impor koneksi sequelize yang sudah ada dari migrator kita
const { sequelize } = require('../db/runMigrations'); 
const db = {};

const basename = path.basename(__filename);

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    // Gunakan instance sequelize yang diimpor untuk memuat model
    const model = require(path.join(__dirname, file))(sequelize, require('sequelize').DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = require('sequelize');

module.exports = db;