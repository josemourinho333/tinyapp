/// helper, given email, return object with ID and PASSWORD associated with the email
const getUserByEmail = (email, users) => {
  for (const user in users) {
    if (email === users[user].email) {
      return users[user];
    }
  }
  return {};
};

/// filters urlsdatabase based on cookie user_id give
const filterURLs = (userID, urlDataBase) => {
  const filtered = {};
    for (const key in urlDataBase) {
      console.log('helper', urlDataBase[key]);
      console.log('user ID', userID);
      if (urlDataBase[key].userID === userID) {
        filtered[key] = urlDataBase[key];
      }
    }
  return filtered;
};

/// checking if given email already exists in users user object
const userEmailExists = (email, users) => {
  for (const user in users) {
    if (email === users[user].email) {
      return true;
    }
  }
  return false;
};

/// generate random 6 character strings
function generateRandomString() {
  const randomNum = () => {
    return Math.floor(Math.random() * 26) + 97;
  }

  return String.fromCharCode(randomNum()).toUpperCase() + String.fromCharCode(randomNum()) + String.fromCharCode(randomNum()).toUpperCase() + String.fromCharCode(randomNum()) + String.fromCharCode(randomNum()).toUpperCase() + String.fromCharCode(randomNum())
};

module.exports = {
  getUserByEmail,
  filterURLs,
  userEmailExists,
  generateRandomString,
};