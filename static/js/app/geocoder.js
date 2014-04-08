define(function(){
  var geocoder = function (address, callback) {
    $.when(
      $.getJSON("gt/geocode?address=" + address)
    ).then(
      callback,
      function (err) {
        console.error('Error geocoding address "' + address + '": ', err.statusText, err);
      }
    );
  };
  return geocoder;
});