const User = require('../models/User');

const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      await User.create({
        email: 'admin@system.local',
        password: 'admin', // bcrypt hashes it in pre-save hook
        role: 'admin'
      });
      console.log('Default admin user seeded successfully (admin@system.local / admin)');
    } else {
      console.log('Admin user already exists. Skipping seed.');
    }
  } catch (error) {
    console.error('Error seeding admin user:', error.message);
  }
};

module.exports = seedAdmin;
