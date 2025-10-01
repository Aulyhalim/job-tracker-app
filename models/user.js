'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      this.hasMany(models.Application, { foreignKey: 'userId' });
    }
  }
  User.init({
    username: {
        type: DataTypes.STRING,
        unique: true, // Wajib: Username harus unik
        allowNull: false 
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    // PENAMBAHAN KOLOM EMAIL DENGAN BATASAN UNIK
    email: {
        type: DataTypes.STRING,
        unique: true, // Wajib: Email harus unik
        allowNull: false
    }
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};