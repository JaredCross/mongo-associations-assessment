
module.exports = {
  userValidation: function (email, firstName, lastName, password, confirmation, data) {
    var errorMessArr = [];
      if (data) {
        errorMessArr.push('User with that email already exists');
      }
      if (email.trim() === '') {
        errorMessArr.push('Email cannot be blank');
      }
      if (firstName.trim() === '') {
        errorMessArr.push('First Name cannot be blank');
      }
      if (lastName.trim() === '') {
        errorMessArr.push('Last Name cannot be blank');
      }
      if (password.trim() === '') {
        errorMessArr.push('Password cannot be blank');
      }
      if (confirmation.trim() === '') {
        errorMessArr.push('Password confirmation cannot be blank');
      }
      if (password != confirmation) {
        errorMessArr.push('Passwords must match');
      }
      if(errorMessArr.length > 0) {
        return  errorMessArr;
      }
  }
};
