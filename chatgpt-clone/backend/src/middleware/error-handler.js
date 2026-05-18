
export const errorHandler = (err, req, res, next) => {
  console.error('Error in request:', err.message)
  return res.status(err.status || 500).json({
    status: false,
    message: err.message ||  "Something went wrong try again later",
  });
};


// A custom error-handling middleware in Express.js centralizes all error handling in one place, so controllers can focus only on their main logic. It keeps your code cleaner, avoids repeating the same try/catch response code, and ensures all API errors are returned in a consistent format. It also improves security and debugging by letting you log real errors internally while showing safe, user-friendly messages to clients.