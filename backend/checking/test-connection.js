import mysql from 'mysql2/promise';

const testConnection = async () => {
  console.log('🔧 Testing MySQL connection with Shrinath user...\n');
  
  const config = {
    host: 'localhost',
    user: 'Shrinath',
    password: 'your_actual_password_here', // ← Your actual password
    database: 'rfid-project',
    port: 3306
  };

  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ MySQL connection SUCCESSFUL!');
    console.log('   User: Shrinath');
    console.log('   Database: rfid-project');
    
    // Test if database exists
    const [databases] = await connection.execute('SHOW DATABASES LIKE "rfid-project"');
    if (databases.length > 0) {
      console.log('✅ Database "rfid-project" exists');
    } else {
      console.log('❌ Database "rfid-project" does not exist');
    }
    
    await connection.end();
    return true;
  } catch (error) {
    console.log('❌ MySQL connection FAILED:');
    console.log('   Error:', error.message);
    console.log('   Code:', error.code);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 Solution: Wrong password for user "Shrinath"');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('💡 Solution: Database does not exist');
    }
    
    return false;
  }
};

testConnection();