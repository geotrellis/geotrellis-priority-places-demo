define(['app/map', 'app/report'], function(map, report){
  var getFeatureUrl = function(lat,lng) {
      return "gt/getParcel?lat=" + lat + "&lng=" + lng;
  }

  var template = Handlebars.compile($('#parcel-details-template').html())
  var popup = L.popup();

  var parcelLayer = null; 

  var fetchParcel = function(latlng, cb) {
      $.when(
          $.getJSON(getFeatureUrl(latlng.lat, latlng.lng))
      ).then(
          $.proxy(
              function(parcelJson) {
                  parcelLayer.clearLayers();
                  if(parcelJson.features.length > 0) {
                      parcelLayer.addData(parcelJson);
                      cb(parcelJson.features[0]);
                  }
              }, this),
          function(err) {
              console.error('Error retrieving parcel information: ', err.statusText, err);
          }
      );
  };

  var parcelDetails = function(latlng) {
      fetchParcel(latlng, function(parcel) {
          var address = [parcel.housenumber, parcel.streetname, parcel.streettype].join(' ');

          report.setLocation(latlng, address);

          var content = template(parcel.properties)
          map.panTo(latlng);
          popup.setLatLng(latlng).setContent(content).openOn(map);
      });
  }

  return {
      init : function() {
          map.on('click', function(e) { parcelDetails(e.latlng) });
          parcelLayer = L.geoJson().addTo(map);
      },
      popup: function(latlng) {
          parcelDetails(latlng);
      }
  }
});