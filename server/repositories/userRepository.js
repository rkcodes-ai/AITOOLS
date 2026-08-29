import User from '../models/user.js';
import { getDBStatus } from '../config/database.js';
import { DatabaseError } from '../utils/errors.js';
import bcrypt from 'bcryptjs';

// In-memory user store for development mode when MongoDB is offline
const inMemoryUsers = new Map();

// Helper to create Mongoose-compatible user wrapper object
const createMemoryUserWrapper = (userData) => {
  return {
    _id: userData._id || userData.id,
    id: (userData._id || userData.id).toString(),
    name: userData.name,
    email: userData.email,
    password: userData.password,
    role: userData.role || 'Student',
    status: userData.status || 'active',
    createdAt: userData.createdAt || new Date(),
    updatedAt: userData.updatedAt || new Date(),
    async comparePassword(candidatePassword) {
      if (this.password && this.password.startsWith('$2')) {
        return bcrypt.compare(candidatePassword, this.password);
      }
      return candidatePassword === this.password;
    },
    toSafeObject() {
      return {
        id: (this._id || this.id).toString(),
        name: this.name,
        email: this.email,
        role: this.role,
        status: this.status,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
      };
    },
  };
};

export const userRepository = {
  isReady() {
    return getDBStatus().connected;
  },

  _assertAvailable() {
    if (process.env.NODE_ENV === 'production' && !this.isReady()) {
      throw new DatabaseError('Database persistence is unavailable in production.');
    }
  },

  async findByEmail(email) {
    if (this.isReady()) {
      const normalizedEmail = email ? email.toLowerCase().trim() : '';
      return User.findOne({ email: normalizedEmail });
    }
    this._assertAvailable();
    const normalizedEmail = email ? email.toLowerCase().trim() : '';
    const memUser = inMemoryUsers.get(normalizedEmail);
    if (!memUser) return null;
    return createMemoryUserWrapper(memUser);
  },

  async findById(id) {
    if (this.isReady()) {
      return User.findById(id);
    }
    this._assertAvailable();
    const memUser = inMemoryUsers.get(id);
    if (!memUser) return null;
    return createMemoryUserWrapper(memUser);
  },

  async create({ name, email, password, role = 'user' }) {
    if (this.isReady()) {
      return User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        role,
      });
    }
    this._assertAvailable();

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const id = 'mem_user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);

    const newUser = {
      _id: id,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role || 'user',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    inMemoryUsers.set(newUser.email, newUser);
    inMemoryUsers.set(id, newUser);

    return createMemoryUserWrapper(newUser);
  },

  async updatePassword(userId, newHashedPassword) {
    if (this.isReady()) {
      return User.findByIdAndUpdate(
        userId,
        { password: newHashedPassword },
        { new: true }
      );
    }
    this._assertAvailable();

    const memUser = inMemoryUsers.get(userId);
    if (memUser) {
      memUser.password = newHashedPassword;
      memUser.updatedAt = new Date();
      return createMemoryUserWrapper(memUser);
    }
    return null;
  },

  async updateProfile(userId, { name }) {
    if (this.isReady()) {
      const update = {};
      if (name) update.name = name.trim();
      return User.findByIdAndUpdate(userId, update, { new: true });
    }
    this._assertAvailable();

    const memUser = inMemoryUsers.get(userId);
    if (memUser) {
      if (name) memUser.name = name.trim();
      memUser.updatedAt = new Date();
      return createMemoryUserWrapper(memUser);
    }
    return null;
  },
};
