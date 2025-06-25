const sequelize = require('./db');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function ensureDatabaseExists() {
  const dbName = sequelize.config.database;
  
  const connection = await mysql.createConnection({
    host: sequelize.config.host,
    port: sequelize.config.port,
    user: sequelize.config.username,
    password: sequelize.config.password
  });

  try {
    const [rows] = await connection.query(`SHOW DATABASES LIKE '${dbName}'`);
    
    if (rows.length === 0) {
      console.log(`Database ${dbName} does not exist. Creating...`);
      await connection.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database ${dbName} created successfully.`);
    } else {
      console.log(`Database ${dbName} already exists.`);
    }
  } finally {
    await connection.end();
  }
}

async function dropAllTables() {
  try {
    console.log('\nDropping all existing tables to avoid conflicts...');
    
    // Get all table names
    const [tables] = await sequelize.query("SHOW TABLES");
    const tableNames = tables.map(table => Object.values(table)[0]);
    
    if (tableNames.length > 0) {
      // Disable foreign key checks
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
      
      // Drop all tables
      for (const tableName of tableNames) {
        console.log(`Dropping table: ${tableName}`);
        await sequelize.query(`DROP TABLE IF EXISTS \`${tableName}\``);
      }
      
      // Re-enable foreign key checks
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      
      console.log('All tables dropped successfully.');
    } else {
      console.log('No existing tables found.');
    }
  } catch (error) {
    console.error('Error dropping tables:', error.message);
    // Re-enable foreign key checks even if there was an error
    try {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    } catch (e) {
      // Ignore errors when re-enabling
    }
  }
}

async function restoreBackupData() {
  try {
    console.log('\n=== Restoring Backup Data ===');
    
    // Define backup files and their corresponding models
    const backupFiles = {
      'users_backup.json': 'User',
      'estates_backup.json': 'Estates',
      'favorites_backup.json': 'Favorites',
      'passwordresettokens_backup.json': 'PasswordReset',
      'reviews_backup.json': 'Reviews',
      'transactions_backup.json': 'Transactions'
    };

    // Load models
    const models = require('../models/modelsAssociation');
    require('../models/emailconfirmationtokenModel');

    for (const [backupFile, modelName] of Object.entries(backupFiles)) {
      const backupPath = path.join(__dirname, 'backups', backupFile);
      
      if (!fs.existsSync(backupPath)) {
        console.log(`\nBackup file ${backupFile} not found, skipping.`);
        continue;
      }

      // Check if model exists
      if (!models[modelName]) {
        console.log(`\nModel ${modelName} not found in models, skipping ${backupFile}.`);
        continue;
      }

      console.log(`\nRestoring data from ${backupFile}...`);
      const data = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
      
      if (!data || data.length === 0) {
        console.log(`No data found in ${backupFile}, skipping.`);
        continue;
      }

      try {
        await models[modelName].bulkCreate(data);
        console.log(`Restored ${data.length} records to ${modelName} table.`);
      } catch (error) {
        console.error(`Error restoring data to ${modelName} table:`, error.message);
        // Continue with next file even if this one fails
      }
    }

    console.log('Backup data restoration completed.');
  } catch (error) {
    console.error('Error during backup restoration:', error);
    throw error;
  }
}

async function syncDatabase(options = {}) {
  const { force = false, alter = true } = options;
  
  try {
    console.log('\n=== Starting Database Synchronization ===');
    
    await ensureDatabaseExists();

    console.log('\nAttempting to connect to database...');
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    if (force) {
      await dropAllTables();
    }

    console.log('\nLoading models with associations...');
    const models = require('../models/modelsAssociation');
    require('../models/emailconfirmationtokenModel');
    console.log('Models and associations loaded successfully.');

    console.log('\nStarting model synchronization...');
    await sequelize.sync({ force: true });
    console.log('Model synchronization completed successfully.');

    console.log('\nCurrent tables in database:');
    const [tables] = await sequelize.query("SHOW TABLES");
    console.log(tables.map(table => Object.values(table)[0]).join(', '));

    if (force) {
      await restoreBackupData();
    }

  } catch (error) {
    console.error('\nError during database synchronization:', error);
    console.error('Stack trace:', error.stack);
    
    if (error.message.includes('foreign key') || error.message.includes('incompatible')) {
      console.log('\n=== FOREIGN KEY DEBUGGING ===');
      console.log('This error usually occurs when:');
      console.log('1. Data types of foreign key columns don\'t match exactly');
      console.log('2. Referenced table doesn\'t exist yet');
      console.log('3. Existing foreign key constraints conflict');
      console.log('\nTry running with --force flag to recreate all tables:');
      console.log('node config/createdb.js --force');
    }
    
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('\nDatabase connection closed.');
    console.log('=== Synchronization Process Completed ===');
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const options = {
  force: args.includes('--force'),
  alter: !args.includes('--no-alter')
};

console.log('Options:', options);

syncDatabase(options)
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });