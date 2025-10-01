'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Application extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // TAMBAHKAN BARIS INI untuk mendefinisikan relasi
      this.belongsTo(models.User, { foreignKey: 'userId' });
    }
  }
  Application.init({
    company: DataTypes.STRING,
    position: DataTypes.STRING,
    applicationDate: DataTypes.DATE,
    status: DataTypes.STRING,
    notes: DataTypes.TEXT,
    userId: DataTypes.INTEGER,
    // PENAMBAHAN KOLOM BARU
    expectedSalary: DataTypes.INTEGER,
    source: DataTypes.STRING,
    interviewDate: DataTypes.DATEONLY 
  }, {
    sequelize,
    modelName: 'Application',
  });
  return Application;
};