/** Scenario is a named set of layers and associated weights */
define(
['text!json/scenarios.json', 'app/layers-model'],
function (scenarios, layers){
  scenarios = $.parseJSON(scenarios).scenarios;

  var load = function(name) {
    //don't call me with name that doesn't exist!
    var scenario = _.findWhere(scenarios, {'name': name});

    //iterate through all the layers once to avoid event spam
    _.forEach(layers.list, function(layer) {
      if (scenario.weights[layer.id]) {
        layer.weight = scenario.weights[layer.id];
        layer.active = true;
      }else{
        layer.weight = 0;
        layer.active = false;
      }
    });
  };

  return {
    "load": load,
    "list": scenarios
  };
});
