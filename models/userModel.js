const db = require('../config/db');
const AppError = require('../utilities/appError');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const userSchema = require('../Validators/userValidator');

const defaultUserData = {
  id: null,
  name: null,
  email: null,
  password: null,
  phone: null,
  role: null,
  active: true,
};

class User {
  constructor(data) {
    Object.assign(this, defaultUserData, data);
  }


  static async findAll(){

    let sql = "SELECT * FROM users";
    const [users] = await db.execute(sql);
    return users;
  }
  static async save(data) {
    try {
      const { error, value: userData } = userSchema.validate(data, { abortEarly: false });
      if (error) {
        return { success: false, errors: error.details.map((err) => err.message) };
      }

      // Check if email already exists
      const checkEmailSQL = `SELECT id FROM users WHERE email = ? LIMIT 1`;
      const [existingUser] = await db.execute(checkEmailSQL, [userData.email]);

      if (existingUser.length > 0) {
        throw new AppError('Email already used', 400);
      }

      // Generate UUID if not provided
      if (!userData.id) {
        userData.id = crypto.randomUUID();
      }

      if (userData.password !== userData.passwordConfirm) {
        throw new AppError('Please match password and passwordConfirm', 400);
      }
      userData.password = await bcrypt.hash(userData.password, 12); // Hash password

      // Insert user
      const sql = `INSERT INTO users (id, name, email, password, phone, role, active) VALUES (?, ?, ?, ?, ?, ?, ?)`;
      const values = [userData.id, userData.name, userData.email, userData.password, userData.phone || null, userData.role || 'user', userData.active ?? 1];

      await db.execute(sql, values);

      return {
        success: true,
        user: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
        },
      };
    } catch (error) {
      throw new AppError(`Couldn't add this user: ${error.message}`, 500);
    }
  }
  

  static async findById(id) {
    const sql = `SELECT * FROM users WHERE id = ? LIMIT 1`;
    const [users] = await db.execute(sql, [id]);
    return users.length > 0 ? users[0] : null;
  }

  static async findByIdAndUpdate(id, body) {
    if (!id || typeof body !== 'object' || Object.keys(body).length === 0) {
      throw new AppError('Invalid parameters for updating user', 400);
    }
  
    // Build the SET clause dynamically
    const updates = Object.keys(body)
      .map((key) => `${key} = ?`)
      .join(', ');
    const values = Object.values(body);
  
    if (!updates) {
      throw new AppError('No valid fields to update', 400);
    }
  
    const sql = `UPDATE users SET ${updates} WHERE id = ?`;
  
    try {
      console.log('Executing SQL:', sql, [...values, id]); // 🔍 Debugging
      const [result] = await db.execute(sql, [...values, id]);
  
      if (result.affectedRows === 0) {
        throw new AppError('User not found or no changes made', 404);
      }
      return result;
    } catch (error) {
      console.error('Error executing query:', error); // 🔍 Debugging
      throw new AppError(`Database error: ${error.message}`, 500);
    }
  }
  

  static async findOne(filter = {}, selectFields = []) {
    if (Object.keys(filter).length === 0) {
      throw new AppError('Filter cannot be empty', 400);
    }

    // Default fields to select
    let fields = 'id, name, email, phone, role, active';
    if (selectFields.includes('+password')) {
      fields += ', password';
    }

    // Build WHERE clause dynamically
    const keys = Object.keys(filter);
    const values = Object.values(filter);
    const whereClause = keys.map((key) => `${key} = ?`).join(' AND ');

    const sql = `SELECT ${fields} FROM users WHERE ${whereClause} LIMIT 1`;

    try {
      const [rows] = await db.execute(sql, values);
      return rows.length === 0 ? null : new User(rows[0]); // ✅ Converts result into `User` instance
    } catch (error) {
      throw new AppError(`Error finding user: ${error.message}`, 500);
    }
    
  }


}

User.prototype.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex'); // Generate token

  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex'); // Hash token
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // Expires in 10 minutes

  return resetToken;
};

module.exports = User;
