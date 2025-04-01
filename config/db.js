const mysql = require('mysql2');
try {

const pool = mysql.createPool({
    host:process.env.DB_HOST,
    user:process.env.DB_USER,
    database:process.env.DB_NAME,
    password:process.env.DB_PASSWORD,
});
    
    console.log('Connected to the database!');  
    module.exports = pool.promise();

} catch (error) {
    console.error('Error connecting to the database:', error);
    throw error;
}  


