define(['app/constants', 'app/weighted-overlay'], function(constants, weightedOverlay) {
  var toggleLegend = function(e) {
    $(this).toggleClass('active');
    $('#tool-legend-popover').toggleClass('in');
  };

  var toggleLegendSection = function() {
    $(this).toggleClass('active').find('.glyphicon').toggleClass('glyphicon-chevron-right glyphicon-chevron-down');
    $(this).siblings('ul').toggleClass('collapsed');
  };

  var updateOpacity = function(e) {
    weightedOverlay.setOpacity(e.value / 100.0);
  };

  var $toolLegend = $('.tool-legend');

  var $opacitySlider     = $('.opacity-slider');
  var $legendPopover     = $('#tool-legend-popover');

  $toolLegend.on('click', toggleLegend);
  $opacitySlider.slider('setValue', constants.DEFAULT_OPACITY * 100)
    .on('slide', updateOpacity);
  $legendPopover.on('click', '.collapse-arrow', toggleLegendSection);
});
