define(["app/model", "app/util"], function(model, util){
  var updateColorRamp = function() {
      var $toolColorRamps = $('.tool-ramp');
      var src = $(this).attr('src');
      var key = $(this).attr('id');

      $(this).siblings('img').removeClass('active');
      $(this).addClass('active');
      $toolColorRamps.find('img').attr('src', src);
      model.setColorRamp(key);
  };

  var colorRampTemplate = Handlebars.compile($('#colorramp-template').html());

  return { 
      init : function() {
          $.when(
              $.getJSON('gt/colors')
          ).then(
              $.proxy(
                  function(colorsJson) {
                      var activeColor = model.getColorRamp();
                      _.each(colorsJson.colors, function(color) {
                          if(color.key == activeColor) {
                              color.active = true;
                          } else {
                              color.active = false;
                          };
                      });
                    
                      var $toolColorRamps = $('.tool-ramp');

                      var options = { 
                          placement: 'bottom', 
                          container: '.content', 
                          html: true, 
                          content: colorRampTemplate(colorsJson)
                      };

                      $toolColorRamps.popover(options)
                          .on({'show.bs.popover': util.toggleToolActive,
                               'hide.bs.popover': util.toggleToolActive});

                      $('.content').on('click', '.color-ramp-selector img', updateColorRamp);
                  })
          );
      }
  };
});