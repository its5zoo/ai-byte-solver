import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minLength: 6,
      select: false,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },
    preferences: {
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
      language: { type: String, default: 'en' },
      defaultStartupMode: { type: String, enum: ['dashboard', 'study', 'ide'], default: 'dashboard' },
    },
  },
  { timestamps: true }
);

// unique: true and sparse on fields above already create indexes

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
