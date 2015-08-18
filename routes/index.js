var express = require('express');
var router = express.Router();
var newUser = require('../lib/database/users').create;
var login = require('../lib/database/users').login;
var findUser = require('../lib/database/users').findUser;
var newIngredient = require('../lib/database/users').createOrAddIngredient;
var addRecipe = require('../lib/database/users').createRecipe;
var lookupRecipeData = require('../lib/database/users').lookupRecipeData;
var findAllIngredients = require('../lib/database/users').findAllUserIngredients;
var findThisRecipeIngredients = require('../lib/database/users').findThisRecipeIngredients;

router.get('/', function(req, res, next) {
  res.render('index');
});

router.post('/user', function (req, res, next) {
  var firstName = req.body.first_name;
  var lastName = req.body.last_name;
  var email = req.body.email;
  var password = req.body.password;
  var confirmation = req.body.confirmation;
  newUser(email, firstName, lastName, password, confirmation).then(function (data) {
    if (data === 'success') {
      req.session.email = email;
      res.redirect('/');
    } else {
      res.render('new-user', {errors : data});
    }
  });
});

router.get('/user/new', function (req, res, next) {
  res.render('new-user');
});

router.get('/user/login', function (req, res, next) {
  res.render('login');
});

router.post('/user/login', function (req, res, next) {
  login(req.body.login_email, req.body.login_password).then(function (data) {
    if (data != 'Incorrect email or password') {
      req.session.email = req.body.login_email;
      res.redirect('/user/' + data._id);
    } else {
      res.render('login', {error : data});
    }
  });
});

router.get('/user/:id', function (req, res, next) {
  var userData;
  findUser(req.params.id).then(function (data) {
    userData = data;
    return lookupRecipeData(data.recipes);
  }).then(function (data) {
    res.render('user-show', {userData : userData, recipeData : data});
  });
});

router.get('/user/:id/recipes/new', function (req, res, next) {
  res.render('recipes-new', {userId : req.params.id});
});

router.post('/user/:id/recipes', function (req, res, next) {
  addRecipe(req.body.recipe_name, req.params.id).then(function (recipeData) {
    res.redirect('/user/' + req.params.id + '/recipes/'+recipeData._id+'/'+recipeData.recipeName+'/ingredients/new');
  });
});

router.get('/user/:id/recipes/:recipeId/:name/ingredients/new', function (req, res, next) {
  var allRecipeIngredients;
  findAllIngredients(req.params.id).then(function (allRecipeIngredientsData) {
    allRecipeIngredients = allRecipeIngredientsData;
    return findThisRecipeIngredients(req.params.recipeId);
  }).then(function (data) {
    res.render('ingredients-new', {recipeName : req.params.name, userId : req.params.id, recipeId : req.params.recipeId, allIngredients : allRecipeIngredients, theseIngredients : data});
  });


});

router.post('/user/:id/recipes/:recipeId/:name/ingredients', function (req, res, next) {
  newIngredient(req.body.add_ingredient, req.body.choose_ingredient, req.params.recipeId).then(function (data) {
    res.redirect('/user/'+req.params.id+'/recipes/'+req.params.recipeId+'/'+req.params.name+'/ingredients/new');
  });
});



module.exports = router;
