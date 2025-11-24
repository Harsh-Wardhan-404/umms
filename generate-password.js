const bcrypt = require('bcryptjs');

const password = process.argv[2] || 'admin123';

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  console.log('\n✅ Password hashed successfully!');
  console.log('\nPassword:', password);
  console.log('\nHashed password (copy this to Prisma Studio):');
  console.log(hash);
  console.log('\n');
});

