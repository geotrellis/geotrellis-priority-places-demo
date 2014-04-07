/**
 * Controller for DOM elements that represent a layer
 */
define(
['app/layers-model', 'app/categories-model', 'app/scenarios-model'],
function (layers, categories, scenarios) {
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


  /** Generate slider boxes for the factors */
  var sliderBoxTemplate = Handlebars.compile($('#factor-template').html());;
  var setSliderStyle = function($slider, weight){
    if (weight === 0) {
      $slider.parent().prevAll('.css-radio').prop('disabled', true);
      $slider.parent().next('.count').addClass('zero').text(weight);
    } else {
      $slider.parent().prevAll('.css-radio').prop('disabled', false);
      $slider.parent().next('.count').removeClass('zero').text(weight);
    }
  };

  var appendSliderBox = function($container, layer) {
    var $slider = $(sliderBoxTemplate(layer));
    $container.append($slider);
    $slider.find('.factor-info').tooltip({ placement:'left', container:'#sidebar' });
    $slider.find('.css-radio').on('click', function(e) {
      layers.highlight(layer.id);
    });


    var $slider_input = $slider.find('.slider');
    $slider_input.slider().on('slide', function(e) {
      layer.setWeight(e.value);
      setSliderStyle($(e.target), layer.weight);
    });

    if (layer.weight > 0){ //Init the UI to be in sync with model
      $slider_input.slider('setValue', layer.weight);
      setSliderStyle($slider_input, layer.weight);
    }

    $slider.find('.factor-remove').on('click', function(e) {
      layer.setActive(false);
      if (layer.highlighted){
        $('#all-radio').prop("checked", true);
        layers.highlight(null);
      }
    });

    return $slider;
  };

  /** Populate Scenario Drop Downs */
  var loadScenarios = function($select) {
    _.each(scenarios.list, function(scenario) {
      var option = $("<option>" + scenario.name + "</option>");
      $select.append(option);
    });
    $select.on("change", function(e) { scenarios.load(e.target.value) });
    scenarios.load(scenarios.list[0].name);
  };


  var bind = function($container) {
    //This will populate categories checkboxes and their factors
    _.forEach(categories, _.partial(appendCategory, $container));
    $('#all-radio').on('change', function(e) {layers.highlight(null)});

      //This will populate the drop down and set active factors and their weights
    loadScenarios($('#scenarios-select'));
  };

  return {
    "bind": bind
  }
});