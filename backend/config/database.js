import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'Shrinath', // ← FIXED: DB_USER not DB_HOST
  password: process.env.DB_PASSWORD || 'Tonystark_7777', // Your actual MySQL password here
  database: process.env.DB_NAME || 'rfid-project',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const db = mysql.createPool(dbConfig);

export const testConnection = async () => {
  try {
    const connection = await db.getConnection();
    console.log('✅ MySQL Database connected successfully as user:', dbConfig.user);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('💡 Trying to connect as user:', dbConfig.user);
    
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('💡 Database does not exist. Create it first.');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 Check MySQL username and password in .env file');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 MySQL service is not running. Start MySQL first.');
    }
    
    return false;
  }
};

export default db;