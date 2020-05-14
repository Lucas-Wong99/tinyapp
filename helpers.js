const getUserByEmail = (emailId, data) => {
  for (const user in data) {
    if (emailId === data[user].email) {
      return true;
    }
  }
  return false;
}

module.exports = {
  getUserByEmail,
}