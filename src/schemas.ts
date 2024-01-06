import mongoose from "mongoose";

const mortgageCalculationSchema = new mongoose.Schema({
  loanAmount: Number,
  interestRate: Number,
  term: Number,
  propertyValue: Number,
  timestamp: { type: Date, default: Date.now },
});

export const MortgageCalculationRecord = mongoose.model(
  "MortgageCalculationRecord",
  mortgageCalculationSchema
);

const realEstatePropertySchema = new mongoose.Schema({
  propertyAddress: String,
  purchasePrice: Number,
  purchaseDate: Date,
  originalLoanAmount: Number,
  currentLoanAmount: Number,
  interestRate: Number,
  homeType: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

export const RealEstateProperty = mongoose.model(
  "RealEstateProperty",
  realEstatePropertySchema
);
