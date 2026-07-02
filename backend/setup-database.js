import { createConnection } from 'mysql2/promise';

const dbConfig = {
  host: 'localhost',
  user: 'Shrinath',
  password: 'Tonystark_7777', // ← Your actual MySQL password
  database: 'rfid-project' // ← CHANGE THIS to match your database name
};

async function setupDatabase() {
  let connection;
  
  try {
    console.log('🔧 Setting up RFID-project database...');
    
    // First connect without database to create it
    connection = await createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });

    console.log('✅ Connected to MySQL server');

    // Create database if not exists - USE YOUR DATABASE NAME
    await connection.execute('CREATE DATABASE IF NOT EXISTS `RFID-project`');
    console.log('✅ Database created or already exists');

    // Switch to the database - USE YOUR DATABASE NAME
    await connection.execute('USE `RFID-project`');
    console.log('✅ Using database: RFID-project');

    // ... rest of the table creation code remains the same
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE,
        rfid_uid VARCHAR(50) UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created');

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS nodes (
        node_id VARCHAR(20) PRIMARY KEY,
        location VARCHAR(100),
        type ENUM('locker', 'dustbin') NOT NULL,
        status ENUM('available', 'occupied', 'maintenance') DEFAULT 'available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Nodes table created');

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_node_permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        node_id VARCHAR(20),
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (node_id) REFERENCES nodes(node_id) ON DELETE CASCADE,
        UNIQUE KEY unique_permission (user_id, node_id)
      )
    `);
    console.log('✅ User node permissions table created');

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS access_logs (
        log_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        node_id VARCHAR(20),
        action ENUM('opened', 'closed', 'access_denied') NOT NULL,
        notes TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        closed_timestamp TIMESTAMP NULL,
        FOREIGN KEY (user_id) REFERENCES users(user_id),
        FOREIGN KEY (node_id) REFERENCES nodes(node_id)
      )
    `);
    console.log('✅ Access logs table created');

    // Insert sample data
    await connection.execute(`
      INSERT IGNORE INTO nodes (node_id, location, type) VALUES 
      ('DBIN_001', 'Floor 1 - Entrance', 'dustbin'),
      ('DBIN_002', 'Floor 1 - Corridor A', 'dustbin'),
      ('DBIN_003', 'Floor 2 - Common Area', 'dustbin'),
      ('DBIN_004', 'Floor 2 - Cafeteria', 'dustbin')
    `);
    console.log('✅ Sample dustbins inserted');

    await connection.execute(`
      INSERT IGNORE INTO users (name, email, rfid_uid) VALUES 
      ('John Doe', 'john@email.com', 'A1B2C3D4E5'),
      ('Jane Smith', 'jane@email.com', 'F6G7H8I9J0'),
      ('Admin User', 'admin@rfid.com', 'ADMIN12345')
    `);
    console.log('✅ Sample users inserted');

    await connection.execute(`
      INSERT IGNORE INTO user_node_permissions (user_id, node_id) VALUES 
      (1, 'DBIN_001'), (1, 'DBIN_002'), (2, 'DBIN_003'), (2, 'DBIN_004')
    `);
    console.log('✅ Sample permissions inserted');

    console.log('\n🎉 RFID-project database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();