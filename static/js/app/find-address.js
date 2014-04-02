define(['app/geocoder', 'app/util'], function(geocoder, util){
  var template = Handlebars.compile($('#find-address-template').html());

  var setAddress = function(results) {
      if (results.candidates.length != 0) {
          var location = results.candidates[0].location;
          parcelDetails.popup({ lat: location.y, lng: location.x });
      } else {
          alert("Address not found!");
      }
  };

  var onShowPopup = function(e) {
      var $input = $('#find-address-search')

      $('#find-address-go').on('click', function(e) { 
          geocoder($input.val(),setAddress);
      });

      $input.keypress(function (e) {
          if (e.which == 13) {
              geocoder($input.val(),setAddress);
          }
      });
  };

  return {
      init : function() {
          var $toolFindAddress  = $('.tool-address-search');

          var findAddrOpts = { 
              placement: 'bottom', 
              container: '.content', 
              html: true, 
              content: template()
          };

          $toolFindAddress.popover(findAddrOpts)
                          .on({'show.bs.popover': util.toggleToolActive, 
                               'hide.bs.popover': util.toggleToolActive,
                               'shown.bs.popover': onShowPopup });
      }
  }
});