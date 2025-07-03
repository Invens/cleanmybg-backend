const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('User', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: { type: DataTypes.STRING, allowNull: true },
    provider: { type: DataTypes.ENUM('local', 'google'), defaultValue: 'local' },
    credits: { type: DataTypes.INTEGER, defaultValue: 2 },
    subscriptionPlan: {
      type: DataTypes.ENUM('free', 'payg', 'premium', 'business'),
      defaultValue: 'free',
      field: 'subscriptionPlan', // ✅ tells Sequelize to map camelCase → snake_case
    },
    
    planExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'planExpiresAt', // maps JS field to DB column
    },
  }, {
    tableName: 'users',
    timestamps: false,
  });
