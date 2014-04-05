/**
 * Controller for DOM elements that represent a layer
 */
// TODO - Add category weight sliders
define(
['app/layers-model', 'app/categories-model'],
function (layers, categories) {
  var checkboxTemplate = Handlebars.compile($('#factor-checkbox-template').html());
  /** map layer.id -> $slider */
  var sliders = {}

  /** Generate layer checkbox element that controls that "active" state of the layer */
  var appendCheckbox = function($container, layer) {
    layer.counter++;
    var $factor = $(checkboxTemplate(layer));
    $container.append($factor);
    var $cb = $factor.find(":checkbox");
    $(layer).on('changed', function() {
      $cb.prop('checked', layer.active);
      if (layer.active){
        //this guard is needed because this will be called 1+ if a layer has 1+ checkboxes
        if(! sliders[layer.id]) { sliders[layer.id] = appendSliderBox($(".factors"), layer) };
      }else{
        if(sliders[layer.id]) {
          sliders[layer.id].remove();
          delete sliders[layer.id];
        }
      }
    });
    $cb.change(function() { layer.setActive($cb.prop("checked")); });

    return $cb;
  };

  /** Generate full category element with appropriate layers */
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

  var sliderBoxTemplate = Handlebars.compile($('#factor-template').html());;
  var appendSliderBox = function($container, layer) {
    var $slider = $(sliderBoxTemplate(layer));
    $container.append($slider);
    $slider.find('.factor-info').tooltip({ placement:'left', container:'#sidebar' });
    $slider.find('.css-radio').on('change', function(e) {
      //TODO - clicking this should keep  only THIS layer "rendered"
      //layers.setActiveLayer(layer.id);
      //model.toggleActiveLayer(layer,e.target);
      //toggleFactorRadio(e);
    });
    $slider.find('.slider').slider().on('slide', function(e) {
      layer.setWeight(e.value);
      if (e.value === 0) {
        $(e.target).parent().prevAll('.css-radio').prop('disabled', true);
        $(e.target).parent().next('.count').addClass('zero').text(e.value);
      } else {
        $(e.target).parent().prevAll('.css-radio').prop('disabled', false);
        $(e.target).parent().next('.count').removeClass('zero').text(e.value);
      }

      //model.updateLayerWeight(layer,e.value);
      //updateLayerWeight(e);
    });
    $container.find('.factor-remove').on('click', function(e) {
      layer.setActive(false);
      //model.removeActiveLayer(layer);
      //removeFactor(e);
    });

    return $slider;
  };


  var bind = function($container) {
    _.forEach(categories, _.partial(appendCategory, $container))
  };

  return {
    "bind": bind
  }
});