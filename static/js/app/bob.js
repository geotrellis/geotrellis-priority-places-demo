/**
 * Controller for DOM elements that represent a layer
 */
define(
['app/layers-model', 'app/categories-model'],
function (layers, categories) {
  var checkboxTemplate = Handlebars.compile($('#factor-checkbox-template').html());

  /** Generate layer checkbox element that controls that "active" state of the layer */
  var appendCheckbox = function($container, layer) {
    layer.counter++;
    var $factor = $(checkboxTemplate(layer));
    $container.append($factor);
    var $cb = $factor.find(":checkbox");
    $(layer).on('changed', function() { $cb.prop('checked', layer.active); });
    $cb.change(function() { layer.setActive($cb.prop("checked")); });

    return $cb;
  };

  var categoryTemplate = Handlebars.compile($('#factor-category-template').html());
  var appendCategory = function($container, category) {
    var $category = $(categoryTemplate(category));
    $container.append($category);
    _.forEach(category.layers, _.partial(appendCheckbox, $category.find("ul")));

    var $cb = $category.find('> input');
    $(category).on('changed', function(){ $cb.prop("checked", category.active); });
    $cb.change(function() {category.setActive($cb.prop("checked")); });

    return $category;
  };

  var bind = function($container) {
    _.forEach(categories, _.partial(appendCategory, $container))
  };

  return {
    "bind": bind
  }
});