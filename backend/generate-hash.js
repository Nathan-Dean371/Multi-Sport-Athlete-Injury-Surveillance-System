const bcrypt = require('bcryptjs');

async function hashPassword() {
  const password = 'password123';
  const hash = await bcrypt.hash(password, 10);
  console.log('Password: password123');
  console.log('Bcrypt Hash:', hash);
  console.log('\nSQL Update Command:');
  console.log(`UPDATE user_accounts SET password_hash = '${hash}' WHERE email LIKE '%@email.com' OR email LIKE '%@physio.ie' OR email LIKE '%@admin.ie';`);
}

hashPassword();
