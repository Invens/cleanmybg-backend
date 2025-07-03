const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'Transaction',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id', // maps JS field to DB column
      },      
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      creditsAdded: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      razorpay_order_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      razorpay_payment_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      payment_status: {
        type: DataTypes.ENUM('pending', 'success', 'failed'),
        defaultValue: 'pending',
      },
      subscriptionPlan: {
        type: DataTypes.ENUM('free', 'payg', 'premium', 'business'),
        defaultValue: null, // Changed to null to avoid overriding
        field: "subscription_plan",
      },
    },
    {
      timestamps: false,
      tableName: 'transactions',
    }
  );
