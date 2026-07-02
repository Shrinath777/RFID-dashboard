import db from '../config/database.js';

const checkUsers = async () => {
  try {
    console.log('👥 Checking users in database...\n');
    
    // Count total users
    const [countResult] = await db.execute('SELECT COUNT(*) as total_users FROM users');
    console.log(`📊 Total Users: ${countResult[0].total_users}`);
    
    // Get all users with details
    const [users] = await db.execute('SELECT user_id, name, email, rfid_uid FROM users');
    
    console.log('\n📋 User Details:');
    users.forEach(user => {
      console.log(`   ID: ${user.user_id}, Name: ${user.name}, Email: ${user.email}, RFID: ${user.rfid_uid}`);
    });
    
    if (users.length === 0) {
      console.log('\n💡 No users found. You can create users through your website.');
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error.message);
  }
};

checkUsers();