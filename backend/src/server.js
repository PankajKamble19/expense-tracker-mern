
const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("./config/db");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");

const {
  errorHandler,
  notFound,
} = require("./middleware/errorMiddleware");

const authRoutes = require("./routes/authRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const accountRoutes = require("./routes/accountRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const savingsGoalRoutes = require("./routes/savingsGoalRoutes");

const {
  processRecurringTransactions,
} = require("./utils/recurringTransactions");

const app = express();


// ==========================================
// SECURITY MIDDLEWARE
// ==========================================

// Add security-related HTTP headers
app.use(helmet());

// Allow requests only from configured frontend
app.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      "http://localhost:5173",
  }),
);

// Prevent MongoDB operator injection
app.use(mongoSanitize());


// ==========================================
// BODY PARSER
// ==========================================

app.use(express.json());


// ==========================================
// API ROUTES
// ==========================================

app.use("/api/auth", authRoutes);

app.use(
  "/api/transactions",
  transactionRoutes,
);

app.use("/api/accounts", accountRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/budgets", budgetRoutes);

app.use(
  "/api/savings-goals",
  savingsGoalRoutes,
);


// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/", (req, res) => {
  res.json({
    message: "Expense Tracker API is running",
  });
});


// ==========================================
// 404 HANDLER
// ==========================================

app.use(notFound);


// ==========================================
// CENTRALIZED ERROR HANDLER
// ==========================================

app.use(errorHandler);


// ==========================================
// START SERVER
// ==========================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  // Process recurring transactions when server starts
  await processRecurringTransactions();

  // Check every 5 minutes
  setInterval(async () => {
    console.log(
      "Checking recurring transactions...",
    );

    await processRecurringTransactions();
  }, 5 * 60 * 1000);

  app.listen(PORT, () => {
    console.log(
      `Server running on port ${PORT}`,
    );
  });
};

startServer();

