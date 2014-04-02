define(['app/model'], function (model){
  var $sidebar = {};
  var $allFactorsPanel = {};
  var $manageFactorsBtn = {};

  var loadFactors = function() {
      var $factorsList       = $('.factors');
      var factorTemplate = Handlebars.compile($('#factor-template').html());

      _.forEach(model.getLayers(), function(layer) {
          // Is there a better way to create the templates so that I can bind
          // the on('slide',...) event to close over the specific 'layer' var it is for?
          var $parentContainer = $factorsList.append(factorTemplate(layer));
          var $container = $parentContainer.find('#layer-'+layer.id);
          $container.find('.factor-info').tooltip({ placement:'left', container:'#sidebar' });
          $container.find('.css-radio').on('change', function(e) {
              model.toggleActiveLayer(layer,e.target);
              toggleFactorRadio(e);
          });
          $sidebar.find('#all-radio').on('change', function(e) {
              model.resetActiveLayer(layer);
              toggleFactorRadio(e);
          });
          $container.find('.slider').slider().on('slide', function(e) {
              model.updateLayerWeight(layer,e.value);
              updateLayerWeight(e);
          });
          $container.find('.factor-remove').on('click', function(e) {
              model.removeActiveLayer(layer);
              removeFactor(e);
          });
      });
  };

  var loadAllFactors = function() {
      var allFactorsTemplate = Handlebars.compile($('#all-factors-template').html());
      var $container = 
          $allFactorsPanel.append(allFactorsTemplate({ categories : model.getCategories() }));
  };

  var loadScenarios = function(scenarios) {
      var $scenarios_select = $('#scenarios-select');
    
      _.each(scenarios, function(scenario) {
          var option = $("<option>" + scenario.name + "</option>");
          $scenarios_select.append(option);
      });
  }

  var removeFactor = function(e) {
      $(e.target).closest('.factor').remove();
  };

  var toggleSidebar = function() {
      $sidebar.toggleClass('active');
      $(this).toggleClass('active');
  };

  var toggleFactorsPanel = function() {
      $allFactorsPanel.toggleClass('hide-panel');
      $manageFactorsBtn.toggleClass('active');
  };

  var toggleFactorRadio = function(e) {
      $('.factor').removeClass('active');
      $(e.target).parent().toggleClass('active');
  };

  var toggleAllFactorsList = function() {
      $(this).find('.glyphicon').toggleClass('glyphicon-chevron-right glyphicon-chevron-down');
      $(this).parent().toggleClass('collapsed');
  };

  var updateLayerWeight = function(e) {
      // Sets the count with the slider's value -5 thru 5
      if (e.value === 0) {
          $(e.target).parent().prevAll('.css-radio').prop('disabled', true);
          $(e.target).parent().next('.count').addClass('zero').text(e.value);
      } else {
          $(e.target).parent().prevAll('.css-radio').prop('disabled', false);
          $(e.target).parent().next('.count').removeClass('zero').text(e.value);
      }
  };

  var updateScenario = function() {
      // TODO: Change scenarios with the dropdown list
  };

  return {
      init : function(scenarios) {
          // Panels
          $sidebar           = $('#sidebar');
          $allFactorsPanel   = $('.all-factors');

          loadFactors();
          loadAllFactors();
          loadScenarios(scenarios);

          var $toggleSidebar     = $('#toggle-sidebar');
          var $scenarioSelect    = $('#scenario-select');

          // Buttons
          $manageFactorsBtn  = $('.manage-factors-btn');

          // Panels
          $sidebar.on('click', '.manage-factors-btn', toggleFactorsPanel);
          $toggleSidebar.on('click', toggleSidebar);

          // Inputs
          $scenarioSelect.on('change', updateScenario);
          $sidebar.on('click', '.collapse-arrow', toggleAllFactorsList);
      }
  };
});