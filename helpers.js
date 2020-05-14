const getUserByEmail = (emailId, data) => {
  for (const user in data) {
    if (emailId === data[user].email) {
      console.log(data[user])
      return user;
    }
  }
  return undefined;
}

const urlsForUser = function(id, urls) {
  let results = {};
  for (const url in urls) {
    if (id === urls[url].user_id) {
      results[url] = urls[url];
    }   
  }
  return results;
}

const generateRandomString = () => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

module.exports = {
  getUserByEmail,
  urlsForUser,
  generateRandomString
}