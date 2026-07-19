require('dotenv').config(); //saves simplicity for when switching OS 
const { Pool } = require('pg'); 

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle database client:', err);
});

module.exports = pool; 

