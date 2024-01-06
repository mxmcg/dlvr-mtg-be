import { ApolloServer } from "@apollo/server";
import gql from "graphql-tag";
import mongoose from "mongoose";
import { authResolvers, User } from "./users";
import { startStandaloneServer } from "@apollo/server/standalone";

import { MortgageCalculationRecord, RealEstateProperty } from "./schemas";

const typeDefs = gql`
  type MortgageCalculation {
    monthlyPayment: Float
    propertyValue: Float
  }

  type Query {
    calculateMortgage(
      loanAmount: Float!
      interestRate: Float!
      term: Int!
      propertyValue: Float!
    ): MortgageCalculation
    getUserProperties(userId: String!): [RealEstateProperty]
  }

  type Mutation {
    signUp(username: String!, password: String!): String
    logIn(username: String!, password: String!): String
    saveMortgageCalculation(
      userId: String!
      loanAmount: Float!
      interestRate: Float!
      term: Int!
      propertyValue: Float!
    ): MortgageCalculation
    addRealEstateProperty(
      userId: String!
      propertyAddress: String!
      purchasePrice: Float!
      purchaseDate: String!
      originalLoanAmount: Float!
      currentLoanAmount: Float!
      interestRate: Float!
      homeType: String!
    ): RealEstateProperty
  }

  type RealEstateProperty {
    propertyAddress: String
    purchasePrice: Float
    purchaseDate: String
    originalLoanAmount: Float
    currentLoanAmount: Float
    interestRate: Float
    homeType: String
  }
`;

export const mortgageResolvers = {
  Mutation: {
    saveMortgageCalculation: async (
      _: any,
      {
        userId,
        loanAmount,
        interestRate,
        term,
        propertyValue,
      }: {
        userId: string;
        loanAmount: number;
        interestRate: number;
        term: number;
        propertyValue: number;
      }
    ) => {
      // Perform the mortgage calculation and save it
      const calculation = new MortgageCalculationRecord({
        loanAmount,
        interestRate,
        term,
        propertyValue,
      });
      await calculation.save();

      // Link the calculation to the user
      await User.findByIdAndUpdate(userId, {
        $push: { mortgageCalculations: calculation._id },
      });

      return calculation;
    },
  },
};

const resolvers = {
  Query: {
    getUserProperties: async (_, { userId }) => {
      try {
        const properties = await RealEstateProperty.find({ user: userId });
        return properties;
      } catch (error) {
        console.error(error);
        throw new Error("Error fetching user properties");
      }
    },
    calculateMortgage: async (
      _,
      { loanAmount, interestRate, term, propertyValue }
    ) => {
      console.log("Calculating ...");
      // Perform the calculation
      const monthlyRate = interestRate / 100 / 12;
      const payments = term * 12;
      const x = Math.pow(1 + monthlyRate, payments);
      const monthlyPayment = (loanAmount * x * monthlyRate) / (x - 1);

      // Save the calculation parameters to MongoDB
      const record = new MortgageCalculationRecord({
        loanAmount,
        interestRate,
        term,
        propertyValue,
      });
      await record.save();

      // Return the result
      return {
        monthlyPayment: isFinite(monthlyPayment) ? monthlyPayment : null,
      };
    },
  },
  Mutation: {
    ...mortgageResolvers.Mutation,
    ...authResolvers.Mutation,
  },
};

async function startServer() {
  try {
    // Connect to MongoDB using Mongoose
    await mongoose.connect(
      "mongodb+srv://maxmcgee:test123@cluster0.chxwbjv.mongodb.net/?retryWrites=true&w=majority"
    );
    console.log("Connected to MongoDB using Mongoose");

    // Start the Apollo Server
    const server = new ApolloServer({ typeDefs, resolvers });
    const { url } = await startStandaloneServer(server, {
      listen: { port: 4000 },
    });
    console.log(`🚀 Server ready at: ${url}`);
  } catch (error) {
    console.error("Error starting the server or connecting to MongoDB:", error);
  }
}

startServer();
