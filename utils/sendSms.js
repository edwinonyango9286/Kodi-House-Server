const africastalking = require("africastalking");
const logger = require("./logger");

// Initialize the Africa's Talking client
const client = africastalking({
  apiKey: process.env.AFRICAS_TALKING_API_KEY,
  username: process.env.AFRICAS_TALKING_USERNAME,
});

console.log(process.env.AFRICAS_TALKING_API_KEY, process.env.AFRICAS_TALKING_USERNAME)

// Function to send SMS
const sendSMS = async (to, message, from = "Kodi House") => {
  try {
    const response = await client.SMS.send({
      to: to,
      message: message,
      from: from,
    });
    return {
      status: "SUCCESS",
      message: "SMS sent successfully.",
      data: response,
    };
  } catch (error) {
    logger.error(error.message);
    return {
      status: "FAILED",
      message: error.message,
    };
  }
};

module.exports = sendSMS;