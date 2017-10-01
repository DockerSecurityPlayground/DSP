# UI Tinymce - [AngularJS](http://angularjs.org/) directive for [TinyMCE](http://tinymce.com).

[![Build Status](https://travis-ci.org/angular-ui/ui-tinymce.png)](https://travis-ci.org/angular-ui/ui-tinymce) 
[![Join the chat at https://gitter.im/angular-ui/ui-tinymce](https://badges.gitter.im/angular-ui/ui-tinymce.svg)](https://gitter.im/angular-ui/ui-tinymce?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

# Requirements

- AngularJS 1.4.x or higher and it has been tested with Angular 1.4.8.
- TinyMCE 4

# Testing

We use karma and jshint to ensure the quality of the code.  The easiest way to run these checks is to use grunt:
```
npm install -g grunt-cli
npm install
bower install
grunt
```  

The karma task will try to open Chrome as a browser in which to run the tests.  Make sure this is available or change the configuration in `test\test.config.js`

# Usage

We use [bower](http://twitter.github.com/bower/) for dependency management.  Add

```
dependencies: {
"angular-ui-tinymce": "latest"
}
```

To your `bower.json` file. Then run

```
bower install
```

This will copy the ui-tinymce files into your `components` folder, along with its dependencies. Load the script files in your application:

```html
<script type="text/javascript" src="app/bower_components/tinymce/tinymce.js"></script>
<script type="text/javascript" src="app/bower_components/angular/angular.js"></script>
<script type="text/javascript" src="app/bower_components/angular-ui-tinymce/src/tinymce.js"></script>
```

Add the tinymce module as a dependency to your application module:

```javascript
var myAppModule = angular.module('MyApp', ['ui.tinymce'])
```

Apply the directive to your form elements:

```html
<form method="post">
  <textarea ui-tinymce ng-model="tinymceModel"></textarea>
</form>
```

**Be sure not to set an `id` attribute**. This is because the directive needs to maintain selector knowledge in order to handle buggy behavior in TinyMCE when DOM manipulation is involved, such as in a reordering of HTML through ng-repeat or DOM destruction/recreation through ng-if.

When using other directives which do DOM manipulation involving elements with `ui-tinymce`, you may need to re-render the editor due to this buggy behavior with TinyMCE. For those situations, it is recommended to use the `$tinymce:refresh` event, which will handle re-rendering the editor to fix this problem.

## Working with ng-model

The ui-tinymce directive plays nicely with the ng-model directive such as ng-required.

If you add the ng-model directive to same the element as ui-tinymce then the text in the editor is automatically synchronized with the model value.

_The ui-tinymce directive stores the configuration options as specified in the [TinyMCE documentation](http://www.tinymce.com/wiki.php/Configuration) and expects the model value to be a html string or raw text, depending on whether `raw` is `true` (default value is `false`)._

**Note:** Make sure you using scopes correctly by following [this wiki page](https://github.com/angular/angular.js/wiki/Understanding-Scopes). If you are having issues with your model not updating, make sure you have a '.' in your model.

> This issue with primitives can be easily avoided by following the "best practice" of always have a '.' in your ng-models – watch 3 minutes worth. Misko demonstrates the primitive binding issue with ng-switch.

## Options

The directive supports all of the standard TinyMCE initialization options as listed [here](http://www.tinymce.com/wiki.php/Configuration).

Use the [setup](https://www.tinymce.com/docs/configure/integration-and-setup/#setup) function to bind different events:

```javascript
scope.tinymceOptions = {
  setup: function(editor) {
      //Focus the editor on load
      $timeout(function(){ editor.focus(); });
      editor.on("init", function() {
        ...
      });
      editor.on("click", function() {
        ...
      });
  }
};
```
By default all TinyMCE content that is set to `ngModel` will be whitelisted by `$sce`.

In addition, it supports these additional optional options

- `format` Format to get content as, i.e. 'raw' for raw HTML, or 'text' for text only. Defaults to 'html'. Documentation [here](http://www.tinymce.com/wiki.php/api4:method.tinymce.Editor.getContent)
- `baseURL` This will set [baseURL property on the EditorManager](https://www.tinymce.com/docs/api/class/tinymce.editormanager/)
- `debounce` This will debounce the model update which helps with performance of editors with large text. Defaults to true.

This option is only supported when present on the `uiTinymceConfig` global injectable - this injectable needs to be an object.

- `baseUrl` Sets the base url used by tinymce asset loading

```javascript
myAppModule.controller('MyController', function($scope) {
  $scope.tinymceOptions = {
    onChange: function(e) {
      // put logic here for keypress and cut/paste changes
    },
    inline: false,
    plugins : 'advlist autolink link image lists charmap print preview',
    skin: 'lightgray',
    theme : 'modern'
  };
});
```
```html
<form method="post">
  <textarea ui-tinymce="tinymceOptions" ng-model="tinymceModel"></textarea>
</form>
```

## Testing your Application (Protractor)

If you are testing your application using Protractor and you wish to be able to automate the
contribution of rich text content as part of the tests, use the TinyMCE API method `insertContent`
in conjunction with the WebDriver's `executeScript` method, like this:

```javascript
browser.driver.executeScript("tinyMCE.activeEditor.insertContent('This is <em>RICH</em> content')");
```

Note that if you use the TinyMCE API method `setContent`, this will fail to update the Angular model
with the entered content, so use `insertContent` instead.

----


# Contributing to the project

We are always looking for the quality contributions! Please check the [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution guidelines.
