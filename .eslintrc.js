module.exports = {
    "extends": "airbnb-base",
    "plugins": [
        "import"
    ],
    "globals" : { 'after' : 1, 'define' : 1 , 'it' : 1, 'describe' : 1, 'afterEach' : 1, 'beforeEach' : 1, 'before' : 1}, 
    "rules" : {
      "comma-dangle": ["off"],
      "brace-style" : ["off"],
      "no-else-return": ["off"],
      "prefer-destructuring": ["off"],
      "new-cap" : ["off"],
      "no-unused-expressions" : ["off"],
      "no-console": ["off"],
      'import/no-extraneous-dependencies': ["error", { devDependencies: true, }],
      "no-underscore-dangle" : ["off"],
      "no-param-reassign" : ["off"],
      "import/no-dynamic-require" : ["off"],
      "arrow-parens": ["off"], 
      "consistent-return": "off",
    }
};
