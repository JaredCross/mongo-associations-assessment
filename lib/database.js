var mongoose = require('mongoose');
mongoose.connect("mongodb://" + process.env.MONGOLAB_URI);
var userValidation = require('./validations').userValidation;
var bcrypt=require('bcrypt');

var userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  recipes: []
});

var User = mongoose.model('User', userSchema);

var recipeSchema = new mongoose.Schema({
  recipeName: String,
  ingredients: []
});

var Recipe = mongoose.model('Recipe', recipeSchema);

var ingredientSchema = new mongoose.Schema({
  ingredientName: String,
  recipes: []
});

var Ingredient = mongoose.model('Ingredient', ingredientSchema);


var self = module.exports = {

  newUser : function(email, firstName, lastName, password, confirmation) {
    var addUserAndVerify = new Promise(function (resolve, reject) {
    User.findOne({email:email}).then(function (data) {
      var errors = userValidation(email, firstName, lastName, password, confirmation, data);
      if (!errors) {
        var hash = bcrypt.hashSync(password, 8);
        return User.create({firstName: firstName, lastName: lastName, email: email, password: hash});
      } else if (errors) {
          resolve(errors);
      }
      }).then(function (data) {
        if(data) {
          resolve(data);
        }
      });
    });
  return addUserAndVerify;
  },

  login : function(email, password) {
    var loginCheck = new Promise(function (resolve, reject) {
      User.findOne({email : email}).then(function (data) {
        if (data) {
          if (bcrypt.compareSync(password, data.password)) {
            resolve(data);
          } else {
            resolve('Incorrect email or password');
          }
        } else {
          resolve('Incorrect email or password');
        }
      });
    });
    return loginCheck;
  },

  findUser : function (id) {
    var findUserInfo = new Promise(function (resolve, reject) {
      User.findOne({_id : id}).then(function (data) {
        resolve(data);
      });
    });
    return findUserInfo;
  },

  createRecipe : function (recipeName, userId) {
    var newRecipe = new Promise(function (resolve, reject) {
      var recipeData;
      Recipe.create({recipeName : recipeName}).then(function (data) {
        recipeData = data;
        return User.findByIdAndUpdate(
          userId,
          {
            $push : {'recipes' : data._id}
          }
        );
      }).then(function (data) {
        resolve(recipeData);
      });
    });
  return newRecipe;
  },

  lookupRecipeData : function (recipesIdArray) {
    return Recipe.find(
      {
      _id :
        {
          $in : recipesIdArray
        }
      });
  },

  newOrAddIngredient : function (createdIngredient, addedIngredient, recipeId) {
    if (createdIngredient.trim() === '') {
      createdIngredient = null;
    }
    var createOrAddIngredientPromise = new Promise(function (resolve, reject) {
      if(addedIngredient && !createdIngredient) {
        Ingredient.findByIdAndUpdate(
          addedIngredient,
          {
            $push : {'recipes' : recipeId}
          }
        ).then(function (data) {
          return Recipe.findByIdAndUpdate (
            recipeId,
            {
              $push : {'ingredients' : data._id}
            }
          );
        }).then(function (data) {
          resolve(data);
        });
      } else if (createdIngredient) {
          Ingredient.create(
            {
              ingredientName : createdIngredient,
              recipes : [recipeId]
            }).then(function (data) {
              return Recipe.findByIdAndUpdate(
                recipeId,
                {
                  $push : {'ingredients' : data._id}
                }
              );
            }).then(function (data) {
              resolve(data);
            });
      }
    });
  return createOrAddIngredientPromise;
  },

  findAllUserIngredients : function (userId) {
    var allUserIngredientsPromise = new Promise(function (resolve, reject) {
      User.findOne({_id : userId}).then(function (data) {
        return Recipe.find(
          {
          _id :
            {
              $in : data.recipes
            }
          });
      }).then(function (data) {
        var combinedArray = [];
        data.forEach(function (el, i) {
          combinedArray = combinedArray.concat(data[i].ingredients);
        });
        var noDupes = combinedArray.reduce(function (newArray, currentElement) {
          if (newArray.indexOf(currentElement) < 0) {
            newArray.push(currentElement);
          }
          return newArray;
        }, []);
      return Ingredient.find(
        {
          _id :
            {
              $in : noDupes
            }
        }
      );
      }).then(function (data) {
        resolve(data);
      });
    });
  return allUserIngredientsPromise;
},

  findThisRecipeIngredients : function (recipeId) {
    var sequence;
    var thisRecipeIngredientsPromise = new Promise(function (resolve, reject) {
      Recipe.findOne({_id : recipeId}).then(function (data) {
        sequence = data.ingredients;
        return Ingredient.find(
          {
            _id :
              {
                $in : data.ingredients
              }
          });
      }).then(function (data) {
        var newData = [];
        for (var i = 0; i < sequence.length; i++) {
          for (var j = 0; j < data.length; j++) {
            if (sequence[i].toString() == data[j]._id.toString()) {
              newData[i] = data[j];
              break;
            }
          }
        }
        resolve(newData);

      });
    });
    return thisRecipeIngredientsPromise;
  },

  updateIngredient : function (ingredientId, ingredientName) {
    return Ingredient.findByIdAndUpdate(
      ingredientId,
      {
        $set : { 'ingredientName' : ingredientName }
      }
    );
  },

  deleteIngredient: function (ingredientId, recipeId) {
    var removeIngredient = new Promise(function (resolve, reject) {
      Recipe.findByIdAndUpdate(
          recipeId,
          {
            $pull : { ingredients : mongoose.Types.ObjectId(ingredientId) }
          }
        ).then(function (data) {
        resolve(data);
        });
      });
  return removeIngredient;
  },

  updateRecipeName: function (recipeId, recipeName) {
    var updateRecipeNamePromise = new Promise(function (resolve, reject) {
      Recipe.findByIdAndUpdate(
       recipeId,
       {
         $set : {'recipeName' : recipeName}
       }
     ).then(function (data) {
       resolve(data);
     });
   });
  return updateRecipeNamePromise;
  },

  deleteRecipe: function (recipeId, userId) {
    var deleteRecipePromise = new Promise(function (resolve, reject) {
      User.findByIdAndUpdate(
        userId,
        {
          $pull : { recipes : mongoose.Types.ObjectId(recipeId) }
        }).then(function () {
            return Ingredient.update(
              {},
                {
                  $pull : {recipes : recipeId}
                },
                {multi : true}
              );
      }).then(function (data) {
          return Recipe.remove({_id : recipeId});
      }).then(function (data) {
        return Ingredient.remove( { 'recipes.0' : {$exists : false} });
      }).then(function () {
        resolve();
      });
    });
    return deleteRecipePromise;
  },

  ingredientData : function (userId, ingredientId) {
    var ingredientDataPromise = new Promise(function (resolve, reject) {
      ingredientId = mongoose.Types.ObjectId(ingredientId);
      Recipe.find(
        {ingredients : ingredientId}
      ).then(function (data) {
        resolve(data);
        });
    });
    return ingredientDataPromise;
  }
};
