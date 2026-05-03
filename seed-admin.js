const mongoose = require('mongoose');

const User = require('./src/models/User');
const Cart = require('./src/models/Cart');

const connectDB = async () => {
  try {
    // Use standard mongodb connection (not +srv)
    const uri = 'mongodb://admin:admin@ac-abmcwvu-shard-00-00.v7xheu4.mongodb.net:27017/coldflyer?ssl=true&replicaSet=atlas-abmcwv-shard-0&authSource=admin';
    await mongoose.connect(uri);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const seedAdmin = async () => {
  try {
    await connectDB();

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@coldflyer.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';
    const adminName = process.env.ADMIN_NAME || 'Admin';

    let admin = await User.findOne({ email: adminEmail });

    if (admin) {
      console.log('Admin user already exists');
      admin.role = 'admin';
      admin.isActive = true;
      await admin.save();
      console.log('Admin user updated');
    } else {
      admin = await User.create({
        name: adminName,
        email: adminEmail,
        phone: '',
        password: adminPassword,
        role: 'admin',
        isEmailVerified: true,
        isActive: true,
      });

      const cart = await Cart.create({ user: admin._id, items: [] });
      admin.cart = cart._id;
      await admin.save();

      console.log('Admin user created');
    }

    console.log(`\nAdmin credentials:`);
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Password: ${adminPassword}`);
    console.log(`  Role: admin\n`);

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedAdmin();