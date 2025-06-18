
const  generateUserPassword = () => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const specials = '@$!%*?&';
  
  // Ensure we have at least one of each required character type
  const randomLower = lowercase[Math.floor(Math.random() * lowercase.length)];
  const randomUpper = uppercase[Math.floor(Math.random() * uppercase.length)];
  const randomNumber = numbers[Math.floor(Math.random() * numbers.length)];
  const randomSpecial = specials[Math.floor(Math.random() * specials.length)];
  
  // Combine all characters and shuffle
  const allChars = lowercase + uppercase + numbers + specials;
  let password = randomLower + randomUpper + randomNumber + randomSpecial;
  
  // Add random characters to reach minimum length (8)
  for (let i = 4; i < 12; i++) { // Generates passwords between 8-12 chars
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password to mix the required characters
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

module.exports = {generateUserPassword}