import mysql from 'mysql2/promise';

const testMySQL = async () => {
  console.log('🔧 Testing MySQL connection...\n');
  
  // Try different password combinations
  const testConfigs = [
    { password: '', description: 'Empty password' },
    { password: 'pass', description: 'Password: pass' },
    { password: 'password', description: 'Password: password' },
    { password: 'root', description: 'Password: root' },
    { password: '1234', description: 'Password: 1234' },
    { password: 'admin', description: 'Password: admin' }
  ];

  for (const config of testConfigs) {
    try {
      const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'Shrinath',
        password: config.password,
        database: 'rfid-project'
      });
      
      console.log(`✅ SUCCESS with ${config.description}`);
      await connection.end();
      return config.password; // Return the working password
      
    } catch (error) {
      console.log(`❌ FAILED with ${config.description}`);
    }
  }
  
  console.log('\n💡 None of the common passwords worked.');
  console.log('💡 You may need to reset the MySQL password for user Shrinath.');
  return null;
};

testMySQL();