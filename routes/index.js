var express = require('express');
var router = express.Router();
var db = require('../lib/database');

router.get('/', function(req, res, next) {
  res.render('index');
});

router.post('/user', function (req, res, next) {
  db.newUser(req.body.email, req.body.first_name, req.body.last_name, req.body.password, req.body.confirmation).then(function (data) {
    if (data._id) {
      req.session.id = data._id;
      res.redirect('/user/'+data._id);
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
  db.login(req.body.login_email, req.body.login_password).then(function (data) {
    if (data._id) {
      req.session.id = data._id;
      res.redirect('/user/' + data._id);
    } else {
      res.render('login', {error : data});
    }
  });
});

router.get('/user/:id', function (req, res, next) {
  var userData;
  var recipeData;
  db.findUser(req.params.id).then(function (data) {
    userData = data;
    return db.lookupRecipeData(data.recipes);
  }).then(function (data) {
    recipeData = data;
    return db.findAllUserIngredients(req.params.id);
  }).then(function (data) {
    res.render('user-show', {userData : userData, recipeData : recipeData, allIngredients : data});
  });
});

router.get('/user/:id/recipes/new', function (req, res, next) {
  res.render('recipes-new', {userId : req.params.id});
});

router.post('/user/:id/recipes', function (req, res, next) {
  db.createRecipe(req.body.recipe_name, req.params.id).then(function (recipeData) {
    res.redirect('/user/' + req.params.id + '/recipes/'+recipeData._id+'/'+recipeData.recipeName+'/ingredients/new');
  });
});

router.get('/user/:id/ingredients/:name/:ingredientId', function (req, res, next) {
  db.ingredientData(req.params.id, req.params.ingredientId).then(function (data) {
    res.render('ingredient-show', {ingredient: req.params.name, recipes : data, userId : req.params.id});
  });

});

router.get('/user/:id/ingredients/edit', function (req, res, next) {
  db.findAllUserIngredients(req.params.id).then(function (data) {
      res.render('ingredients-edit', {allIngredients : data, userData : req.params.id});
  });
});

router.post('/user/:id/ingredients/update', function (req, res, next) {
  db.updateIngredient(req.body.ingredientId, req.body.ingredientName).then(function () {
    res.redirect('/user/'+req.params.id+'/ingredients/edit');
  });
});

router.post('/user/:id/ingredients/delete', function (req, res, next) {
  db.deleteIngredient(req.body.ingredientId).then(function () {
    res.redirect('/user/'+req.params.id+'/ingredients/edit');
  });
});

router.get('/user/:id/recipes/:name/:recipeId', function (req, res, next) {
  db.findThisRecipeIngredients(req.params.recipeId).then(function (data) {
    res.render('recipe-show', {theseIngredients : data, recipeName : req.params.name, userId : req.params.id, recipeId : req.params.recipeId});
  });
});


router.get('/user/:id/recipes/:name/:recipeId/edit', function (req, res, next) {
  var allIngredients;
  db.findAllUserIngredients(req.params.id).then(function (data) {
    allIngredients = data;
    return db.findThisRecipeIngredients(req.params.recipeId);
  }).then(function (data) {
    res.render('recipe-edit', {userData : req.params.id, recipeName: req.params.name, recipeId: req.params.recipeId, theseIngredients: data, allIngredients: allIngredients});
  });
});

router.post('/user/:id/recipes/:name/:recipeId', function (req, res, next) {
  db.updateRecipeName(req.params.recipeId, req.body.recipe_name).then(function (data) {
    res.redirect('/user/' +req.params.id+'/recipes/'+req.body.recipe_name+'/'+req.params.recipeId+'/edit');
  });
});

router.post('/user/:id/recipes/:name/:recipeId/delete', function (req, res, next) {
  db.deleteRecipe(req.params.recipeId, req.params.id).then(function () {
    res.redirect('/user/'+req.params.id);
  });
});

router.get('/user/:id/recipes/:recipeId/:name/ingredients/new', function (req, res, next) {
  var allRecipeIngredients;
  db.findAllUserIngredients(req.params.id).then(function (allRecipeIngredientsData) {
    allRecipeIngredients = allRecipeIngredientsData;
    return db.findThisRecipeIngredients(req.params.recipeId);
  }).then(function (data) {
    res.render('ingredients-new', {recipeName : req.params.name, userId : req.params.id, recipeId : req.params.recipeId, allIngredients : allRecipeIngredients, theseIngredients : data});
  });
});


router.post('/user/:id/recipes/:name/:recipeId/ingredients/new/update', function (req, res, next) {
  db.newOrAddIngredient(req.body.add_ingredient, req.body.choose_ingredient, req.params.recipeId).then(function (data) {
    res.redirect('/user/'+req.params.id+'/recipes/'+req.params.name+'/'+req.params.recipeId+'/edit');
  });
});

router.post('/user/:id/recipes/:recipeId/:name/ingredients', function (req, res, next) {
  db.newOrAddIngredient(req.body.add_ingredient, req.body.choose_ingredient, req.params.recipeId).then(function (data) {
    res.redirect('/user/'+req.params.id+'/recipes/'+req.params.recipeId+'/'+req.params.name+'/ingredients/new');
  });
});

router.post('/user/:id/recipes/:name/:recipeId/ingredients/update', function (req, res, next) {
  db.updateIngredient(req.body.ingredientId, req.body.ingredientName).then(function () {
    res.redirect('/user/'+req.params.id+'/recipes/'+req.params.name+'/'+req.params.recipeId+'/edit');
  });
});

router.post('/user/:id/recipes/:name/:recipeId/ingredients/delete', function (req, res, next) {
  db.deleteIngredient(req.body.ingredientId, req.params.recipeId).then(function () {
    res.redirect('/user/'+req.params.id+'/recipes/'+req.params.name+'/'+req.params.recipeId+'/edit');
  });
});

module.exports = router;
