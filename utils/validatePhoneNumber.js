const validatePhoneNumber = (phoneNumber) => {
  phoneNumber = phoneNumber.trim();
  const phoneNumberRegex = /^\+(\d{1,3})\d{7,14}$/;
  if (!phoneNumberRegex.test(phoneNumber)) {
    throw new Error("Please provide a valid phone number.");
  }
  return true;
};

module.exports = validatePhoneNumber;
