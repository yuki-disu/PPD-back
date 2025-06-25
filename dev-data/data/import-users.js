const fs = require('fs');
const dotenv = require('dotenv');
const path = require('path');
const { Sequelize } = require('sequelize');

// Load environment variables
dotenv.config({ path: './config.env' });

// Import models
const db = require('../../config/db');
const User = require('../../models/userModel');

const dataFilePath = path.join(__dirname, 'importUsers.json');
const users = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));

const backupData = async () => {
    try {
        await db.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        return error;
    }

    const userData = await User.findAll({ raw: true });
    console.log(userData);
    //delete the file if it exists
    if (fs.existsSync(dataFilePath)) {
        fs.unlinkSync(dataFilePath);
    }
    //save it in users.json
    fs.writeFileSync(dataFilePath, JSON.stringify(userData, null, 2));
    console.log('User data saved to users.json');
    process.exit();S
    
}

const importData = async () => {
    try {
        await db.authenticate();
        console.log('Connection has been established successfully.');

        // Sync models
        await db.sync();
        console.log('Models synchronized successfully.');

        // Import each user
        for (const user of users) {
            try {
                const [newUser, created] = await User.findOrCreate({
                    where: { email: user.email },
                    defaults: {
                        username: user.username,
                        firstname: user.firstname,
                        lastname: user.lastname,
                        password: user.password,
                        role: user.role || 'user',
                        active: user.active || true
                    }
                });

                if (created) {
                    console.log(`User created successfully: ${newUser.id}`);
                } else {
                    console.log(`User already exists: ${newUser.id}`);
                }
            } catch (error) {
                console.error(`Error importing user ${user.email}:`, error);
            }
        }

        console.log('All users imported successfully.');
    } catch (error) {
        console.error('Error during import:', error);
    } finally {
        process.exit();
    }
};



if (process.argv[2] === '--backup') {
  console.log('Starting import process...');
  backupData();
} else if (process.argv[2] === '--import') {
  console.log('Starting import process...');
  importData();
} else if (process.argv[2] === '--delete') {
  console.log('Starting delete process...');
  deleteData();
} else {
  console.log('Command not recognized. Use --import or --delete');
  process.exit();
}