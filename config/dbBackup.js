const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

const backupDir = path.join(__dirname, 'backups');
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
}

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER, 
    password: process.env.DB_PASSWORD,
    database: 'homedz',
});

connection.query('SHOW TABLES', (err, tables) => {
    if (err) throw err;

    const tableKey = `Tables_in_homedz`;
    let pending = tables.length;

    if (pending === 0) {
        console.log('No tables found.');
        connection.end();
        return;
    }

    tables.forEach(row => {
        const tableName = row[tableKey];
        connection.query(`SELECT * FROM \`${tableName}\``, (err, results) => {
            if (err) throw err;
            const backupFile = path.join(backupDir, `${tableName}_backup.json`);
            fs.writeFileSync(backupFile, JSON.stringify(results, null, 2));
            console.log(`Backup saved to ${backupFile}`);
            if (--pending === 0) connection.end();
        });
    });
});