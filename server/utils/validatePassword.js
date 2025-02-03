const validatePassword = (password) => {
  password = password.trim();
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  if (!passwordRegex.test(password)) {
    return {
      status: "FAILED",
      message:
        "Password must have at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.",
    };
  }

  return true;
};

module.exports = validatePassword;
