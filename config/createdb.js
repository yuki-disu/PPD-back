const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config({ path: '../config.env' });


const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

const initializeDatabase = async () => {
    try {
        await connection.promise().query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
        console.log(`Database '${process.env.DB_NAME}' ensured.`);

        // Use the database
        await connection.promise().changeUser({ database: process.env.DB_NAME });

        console.log("Column 'owner_id' ensured in 'estates'.");

        await connection.promise().query(`
            CREATE TABLE IF NOT EXISTS users (
                id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                phone VARCHAR(20) UNIQUE,
                role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                active TINYINT(1) DEFAULT 1 CHECK (active IN (0,1))
            );
        `);
        console.log("Table 'users' ensured.");

        await connection.promise().query(`
            CREATE TABLE IF NOT EXISTS estates (
                id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
                owner_id CHAR(36) NOT NULL,
                location VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                type ENUM('studio', 'apartment', 'house') NOT NULL,
                numOfRooms INT NOT NULL CHECK (numOfRooms >= 0),
                numOfBathroom INT NOT NULL CHECK (numOfBathroom >= 0),
                numOfKitchen INT CHECK (numOfKitchen >= 0),
                garageCapacity INT NOT NULL CHECK (garageCapacity >= 0),
                area INT NOT NULL CHECK (area > 0),
                price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
                status ENUM('available', 'sold', 'rented') DEFAULT 'available',
                for_rent TINYINT(1) DEFAULT 0,
                imageCover VARCHAR(255),
                images JSON,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                sold TINYINT(1) DEFAULT 0,
                rented TINYINT(1),
                visibleHouse TINYINT(1) DEFAULT 1,
                centralHeating TINYINT(1) DEFAULT 0,
                alarmsAndSecurity TINYINT(1) DEFAULT 0,
                fireDetector TINYINT(1) DEFAULT 0,
                camera TINYINT(1) DEFAULT 0,
                parking TINYINT(1) DEFAULT 0,
                electricity TINYINT(1) DEFAULT 0,
                gaz TINYINT(1) DEFAULT 0,
                closeToTransportation TINYINT(1) DEFAULT 0,
                closeToBeach TINYINT(1) DEFAULT 0,
                natureView TINYINT(1) DEFAULT 0,
                FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);
        console.log("Table 'estates' ensured.");

        await connection.promise().query(`
            CREATE TABLE IF NOT EXISTS transactions (
                id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
                user_id CHAR(36) NOT NULL,
                estate_id CHAR(36) NOT NULL,
                startDate DATE NOT NULL,
                endDate DATE NOT NULL,
                amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
                transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (estate_id) REFERENCES estates(id) ON DELETE CASCADE,
                CHECK (startDate <= endDate)
            );
        `);
        console.log("Table 'transactions' ensured.");


        await connection.promise().query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
                user_id CHAR(36) NOT NULL,
                estate_id CHAR(36) NOT NULL,
                rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
                review TEXT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (estate_id) REFERENCES estates(id) ON DELETE CASCADE
            );
        `);
        console.log("Table 'reviews' ensured.");
    } catch (error) {
        console.error("Error initializing database:", error);
    } finally {
        connection.end();
    }
};




initializeDatabase();