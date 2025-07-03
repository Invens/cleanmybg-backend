const sequelize = require('../config/db');

const User = require('./userModel')(sequelize);
const Transaction = require('./transactionModel')(sequelize);

// Define associations
User.hasMany(Transaction, { foreignKey: 'user_id' });
Transaction.belongsTo(User, { foreignKey: 'user_id' });


module.exports = {
  sequelize,
  User,
  Transaction,
};
