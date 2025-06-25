const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PasswordReset = sequelize.define(
    'PasswordReset',
    {
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
        },
        passwordResetToken: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        passwordResetExpires: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: DataTypes.NOW,
            field: 'created_at' // Map camelCase to snake_case
        },
    },
    {
        tableName: 'passwordResetTokens',
        timestamps: false, // We're handling createdAt manually
    }
);

module.exports = PasswordReset;