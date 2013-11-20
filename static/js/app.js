jQuery(function ($) {
    'use strict';

    var App = {
        init: function () {
            $.when(
                $.getJSON('json/factors.json'),
                $.getJSON('json/categories.json')
            ).then(
                $.proxy(
                    function(factors, categories) {
                        App.factors = factors[0];
                        App.categories = categories[0];

                        App.cacheElements();
                        App.loadFactors();
                        App.loadAllFactors();
                        App.bindEvents();
                    }, this),
                function(err) {
                    console.error('Error retrieving resources: ', err.statusText, err);
                }
            );
        },

        cacheElements: function () {
            // Panels
            this.$content           = $('.content');
            this.$sidebar           = $('#sidebar');
            this.$toggleSidebar     = $('#toggle-sidebar');
            this.$allFactorsPanel   = $('.all-factors');
            this.$factorsList       = $('.factors');

            // Inputs
            this.$factorSlider      = $('.factor .slider');
            this.$opacitySlider     = $('.opacity-slider');
            this.$scenarioSelect    = $('#scenario-select');

            // Buttons
            this.$manageFactorsBtn  = $('.manage-factors-btn');
            this.$factorCheckbox    = $('.css-checkbox');
            this.$toolColorRamps    = $('.tool-ramp');
            this.$toolFindAddress   = $('.tool-address-search');

            // Templates
            this.factorTemplate = Handlebars.compile($('#factor-template').html());
            this.allFactorsTemplate = Handlebars.compile($('#all-factors-template').html());
        },

        bindEvents: function () {
            var $colorRampHTML = '' +
                '<div class="color-ramp-selector">' +
                '    <img src="http://demo.geotrellis.com/chatta/img/ramps/yellow-to-red-heatmap.png" class="active">' +
                '    <img src="http://demo.geotrellis.com/chatta/img/ramps/bold-land-use-qualitative.png">' +
                '    <img src="http://demo.geotrellis.com/chatta/img/ramps/muted-terrain-qualitative.png">' +
                '    <img src="http://demo.geotrellis.com/chatta/img/ramps/light-to-dark-green.png">' +
                '    <img src="http://demo.geotrellis.com/chatta/img/ramps/purple-to-dark-purple-to-white-heatmap.png">' +
                '</div>';

            var $findAddressHTML = '' +
                '<div class="find-address-container">' +
                '   <label for="find-address-search">Find Address</label>' +
                '   <div class="input-group">' +
                '       <input type="text" class="form-control" id="find-address-search" placeholder="Search by address">' + 
                '       <span class="input-group-btn">' +
                '           <button class="btn btn-primary" type="button">Go!</button>' +
                '       </span>' +
                '   </div>' +
                '</div>';

            // Panels
            this.$sidebar.on('click', '.manage-factors-btn', this.toggleFactorsPanel);
            this.$toggleSidebar.on('click', this.toggleSidebar);

            // Inputs
            this.$sidebar.on('change', '.css-checkbox', this.toggleFactorCheckbox);
            this.$scenarioSelect.on('change', this.updateScenario);
            this.$opacitySlider.slider().on('slide', this.updateOpacity);
            this.$sidebar.on('click', '.collapse-arrow', this.toggleAllFactorsList);
            this.$toolColorRamps.popover({ placement: 'bottom', container: '.content', html: true, content: $colorRampHTML });
            this.$toolFindAddress.popover({ placement: 'bottom', container: '.content', html: true, content: $findAddressHTML });

            // Bootstrap UI
            this.$content.on('click', '.color-ramp-selector img', this.updateColorRamp);
        },

        loadFactors: function() {
            var $container = App.$factorsList.append(App.factorTemplate(App.factors));
                $container.find('.slider').slider().on('slide', App.updateFactorCount);
                $container.find('.factor-info').tooltip({ placement:'left', container:'#sidebar' });
                $container.find('.factor-remove').on('click', App.removeFactor);
        },

        loadAllFactors: function() {
            var $container = App.$allFactorsPanel.append(App.allFactorsTemplate(App.categories));
        },

        toggleSidebar: function() {
            App.$sidebar.toggleClass('active');
            $(this).toggleClass('active');
        },

        toggleFactorsPanel: function() {
            App.$allFactorsPanel.toggleClass('hide-panel');
            App.$manageFactorsBtn.toggleClass('active');
        },

        toggleFactorCheckbox: function() {
            $(this).parent().toggleClass('active');
        },

        toggleAllFactorsList: function() {
            $(this).find('.glyphicon').toggleClass('glyphicon-collapse-up glyphicon-collapse-down');
            $(this).parent().toggleClass('collapsed');
        },

        updateFactorCount: function(e) {
            // Sets the count with the slider's value -5 thru 5
            $(this).parent().next('.count').text(e.value);
        },

        updateScenario: function() {
            // TO DO: Change scenarios with the dropdown list
        },

        updateOpacity: function(e) {
            // TO DO: Change opacity for map layers
            // e.value gives you the value of the slider (0 - 100)
        },

        updateColorRamp: function() {
            var src = $(this).attr('src');

            $(this).siblings('img').removeClass('active');
            $(this).addClass('active');
            App.$toolColorRamps.find('img').attr('src', src);
        },

        removeFactor: function() {
            $(this).parent().parent().remove();
        }
    };

    App.init();
});
