const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");
const asyncHandler = require("express-async-handler");

const sendMail = asyncHandler(async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    service: process.env.SMTP_SERVICE,
    secure: true,
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const { email, subject, template, data } = options;
  const templatePath = path.join(__dirname, "../mail-templates", template);
  const html = await ejs.renderFile(templatePath, data);

  const mailOptions = {
    from: '"Kodi House" <technologieszeent@gmail.com>',
    to: email,
    subject,
    html,
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    return {
      status: "Failed",
      message: error.message,
    };
  }
});

module.exports = sendMail;
