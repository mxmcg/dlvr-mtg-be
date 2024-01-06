import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose, { Schema, Document, Model } from "mongoose";
import { RealEstateProperty } from "./schemas";

interface IUser extends Document {
  username: string;
  password: string;
  mortgageCalculations: mongoose.Types.ObjectId[];
  isValidPassword(password: string): Promise<boolean>;
  generateJWT(): string;
}

const userSchema: Schema = new Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  mortgageCalculations: [
    { type: Schema.Types.ObjectId, ref: "MortgageCalculationRecord" },
  ],
  realEstateProperties: [
    { type: Schema.Types.ObjectId, ref: "RealEstateProperty" },
  ],
});

userSchema.methods.isValidPassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

// Password hashing middleware
userSchema.pre<IUser>("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Generate JWT token
userSchema.methods.generateJWT = function (): string {
  return jwt.sign({ userId: this._id }, "YOUR_SECRET_KEY", { expiresIn: "1h" });
};

export const User = mongoose.model("User", userSchema);

export const authResolvers = {
  Mutation: {
    signUp: async (
      _: any,
      { username, password }: { username: string; password: string }
    ) => {
      const user = new User({ username, password });
      await user.save();
      return user.generateJWT();
    },
    logIn: async (
      _: any,
      { username, password }: { username: string; password: string }
    ) => {
      const user = await User.findOne({ username });
      if (!user || !(await user.isValidPassword(password))) {
        throw new Error("Invalid credentials");
      }
      return user.generateJWT();
    },
    addRealEstateProperty: async (
      _,
      {
        userId,
        propertyAddress,
        purchasePrice,
        purchaseDate,
        originalLoanAmount,
        currentLoanAmount,
        interestRate,
        homeType,
      }
    ) => {
      const property = new RealEstateProperty({
        propertyAddress,
        purchasePrice,
        purchaseDate,
        originalLoanAmount,
        currentLoanAmount,
        interestRate,
        homeType,
        user: userId,
      });
      await property.save();

      await User.findByIdAndUpdate(userId, {
        $push: { realEstateProperties: property._id },
      });

      return property;
    },
  },
};
