const getUserByEmail = (emailId, data) => {
  for (const user in data) {
    if (emailId === data[user].email) {
      console.log(data[user])
      return user;
    }
  }
  return undefined;
}

module.exports = {
  getUserByEmail,
}