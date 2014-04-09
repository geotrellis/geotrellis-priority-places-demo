/** Responsible for managing Color Ramps, used to render weighted overlay */
define(
["app/util", "text!gt/colors"],
function(util, colorsJson) {
  var module = {};

  var colors = $.parseJSON(colorsJson).colors;
  var colorRampTemplate = Handlebars.compile($('#colorramp-template').html());
  var activeColorRamp = 'blue-to-orange';

  module['colors'] = colors;
  module['active'] = activeColorRamp;
  module['setColorRamp'] = function(name) {
    //Need to maintain active field for the popover template
    _.forEach(colors, function(color){
      color.active = color.key === name;
    });
    activeColorRamp = name;
    $(module).trigger('changed');
  };
  module['getColorRamp'] = function() { return activeColorRamp};
  module.setColorRamp('blue-to-orange');

  //Setup the UI elements
  var updateColorRamp = function() {
    var $toolColorRamps = $('.tool-ramp');
    var src = $(this).attr('src');
    var key = $(this).attr('id');

    $(this).siblings('img').removeClass('active');
    $(this).addClass('active');
    $toolColorRamps.find('img').attr('src', src);
    module.setColorRamp(key);
  };

  var options = {
    placement: 'bottom',
    container: '.content',
    html: true,
    content: colorRampTemplate({'colors': colors})
  };

  $('.tool-ramp').popover(options)
    .on({'show.bs.popover': util.toggleToolActive,
      'hide.bs.popover': util.toggleToolActive});

  $('.content').on('click', '.color-ramp-selector img', updateColorRamp);

  return module;
});