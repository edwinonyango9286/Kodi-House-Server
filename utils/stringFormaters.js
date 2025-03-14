const _ = require("lodash");

const descriptionFormater = (description) => {
  return description
    .toLowerCase()
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => _.capitalize(sentence.trim()))
    .join(" ");
};

module.exports = { descriptionFormater };
