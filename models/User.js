import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      required: function () {
        // Password is only required if the user isn't using OAuth
        return !this.googleId;
      },
      minlength: 6,
      select: false, // Prevents password from leaking in standard queries
    },
    avatar: {
      type: String,
      default: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    role:{
      type: String,
      enum: ["user", "admin", "reporter"]
    },
    refreshToken: {
      type: String,
      select: false // Hides it from common queries automatically for safety
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
    
  { timestamps: true }
);

// Hash password before saving to database
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method to compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);