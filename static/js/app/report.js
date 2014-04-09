define(['app/constants'], function(constants) {
  var reportModel = (function() {

    var listeners = [];

    return {
      lat : 0.0,
      lng : 0.0,
      address : "",
      report : { },
      title : '',
      outputFormat : 'pdf',
      studyAreaType : 'radius',
      ring1Radius : 1,
      useRing2 : true,
      ring2Radius : 3,
      useRing3 : true,
      ring3Radius : 5,
      driveTime1 : 3,
      useDriveTime2 : true,
      driveTime2 : 5,
      useDriveTime3 : true,
      driveTime3 : 7,

      notifyChange : function() { 
        _.each(listeners, function(f) { f(); });
      },

      onChange : function(f) {
        listeners.push(f);
      },

      reset : function() {
        // Don't reset most members, user probably wants to carry selections over.
        this.lat = 0.0;
        this.lng = 0.0;
        this.address = "";
        this.title = '';
      },

      isValid : function() {
        var hasTitle = (reportModel.title.length > 0);

        var driveTimesValid = true;
        if(reportModel.studyArea == 'travel-time') {
          // TODO: Check if drive times are valid
          driveTimesValid = true; 
        };

        var radiiValid = true
        if(reportModel.studyArea == 'radius') {
          // TODO: Check if radii are valid
          radiiValid = true;
        };

        return hasTitle &&
          driveTimesValid &&
          radiiValid;
      },

      getQueryParams : function() {
        var studyAreaOptions = {};
        
        if(this.studyAreaType == 'radius') {
          studyAreaOptions.areaType = "RingBuffer";
          studyAreaOptions.bufferUnits = "esriMiles";
          var radii = [ this.ring1Radius ];
          if(this.useRing2) { radii.push(this.ring2Radius); };
          if(this.useRing3) { radii.push(this.ring3Radius); };
          studyAreaOptions.bufferRadii = radii;

        } else if (this.studyAreaType == 'travel-time') {
          studyAreaOptions.areaType = "DriveTimeBufferBands";
          studyAreaOptions.bufferUnits = "esriDriveTimeUnitsMinutes";
          var radii = [ this.driveTime1 ];
          if(this.useDriveTime2) { radii.push(this.driveTime2); };
          if(this.useDriveTime3) { radii.push(this.driveTime3); };
          studyAreaOptions.bufferRadii = radii;
          
        }
        

        var params = 
            [   
              'studyAreas=[{"geometry":{"x":' + this.lng + ',"y":' + this.lat + '}}]',
              'report=' + this.report.reportID,
              'f=bin',
              'format=' + this.outputFormat,
              'reportFields={"title": "' + this.title +
                '", "subtitle": "' + this.report.metadata.name +  
                '", "logo": "' + constants.LOGO_URL + 
                '", "latitude" : "' + this.lat +
                '", "longitude" : "' + this.lng +
                '"}',
              'studyAreasOptions=' + JSON.stringify(studyAreaOptions),
              'useData={"sourceCountry":"US"}'
            ];
        
        return params.join('&');
      }
    };
  })();

  var token = '';
  var expiresOn = '';
  
  var getToken = function(callback) {
    $.when(
      $.getJSON('gt/generateToken')
    ).then(
      function(tokenJson) {
        token = tokenJson.access_token;
        expiresOn = (new Date().getTime() / 1000) + (tokenJson.expires_in - 60); // Err on the side of safety by a minute.
        callback();
      }
    );
  };

  var createReport = function() {
    var sendRequest = function() {
      var params = reportModel.getQueryParams() + '&token=' + token;
      var url = 'http://geoenrich.arcgis.com/arcgis/rest/services/World/geoenrichmentserver/GeoEnrichment/CreateReport?' + params;
      window.location.href = url;
    };

    if(!token) {
      getToken(sendRequest);
    } else {
      if(expiresOn < (new Date().getTime() / 1000)) {
        getToken(sendRequest);
      } else {
        sendRequest();
      }
    }
  };

  var $report_title = {};
  var $report_output_format = {};
  var $report_study_area = {};
  var $create_report_button = {};
  var $radius_1 = {}
  var $radius_2 = {}
  var $radius_3 = {}
  var $traveltime_1 = {}
  var $traveltime_2 = {}
  var $traveltime_3 = {}


  var pushReportModelToUI = function() {
    $report_title.val(reportModel.title);
    $radius_1.val(reportModel.ring1Radius);
    $radius_2.val(reportModel.ring2Radius);
    $radius_3.val(reportModel.ring3Radius);
    $traveltime_1.val(reportModel.driveTime1);
    $traveltime_2.val(reportModel.driveTime2);
    $traveltime_3.val(reportModel.driveTime3);
    $('#report-study-area-radius-2-toggle').attr('checked', reportModel.useRing2);
    $('#report-study-area-radius-3-toggle').attr('checked', reportModel.useRing3);
    $('#report-study-area-traveltime-2-toggle').attr('checked', reportModel.useDriveTime2);
    $('#report-study-area-traveltime-3-toggle').attr('checked', reportModel.useDriveTime3);
  };

  var setReport = function(report) {
    reportModel.report = report;
    
    var existingFormat = null;
    var needsSelectionChanged = false;

    _.each($report_output_format, function(format) {
      var radio = $(format)
      if(! _.contains(report.formats, $(format).val())) {
        if(radio.is(':checked')) { needsSelectionChanged = true; };
        radio.attr('disabled', true);
        radio.parent().addClass('disabled');
      } else {
        radio.parent().removeClass('disabled');
        if(!existingFormat) { existingFormat = $(format) }
      };
    });
    
    if(needsSelectionChanged) {
      if(existingFormat) { 
        existingFormat.parent().addClass('active'); 
        existingFormat.attr('checked', true);
        reportModel.outputFormat = existingFormat.val();
      };
    };

    reportModel.notifyChange();
  };

  return {
    init : function() {
      $report_title = $('#report-title');
      $report_output_format = $('input:radio[name="report-output-format"]');
      $report_study_area = $('input:radio[name="report-study-area"]');
      $create_report_button = $('#create-report-button');
      $radius_1 = $('#report-study-area-radius-1')
      $radius_2 = $('#report-study-area-radius-2')
      $radius_3 = $('#report-study-area-radius-3')
      $traveltime_1 = $('#report-study-area-traveltime-1')
      $traveltime_2 = $('#report-study-area-traveltime-2')
      $traveltime_3 = $('#report-study-area-traveltime-3')

      $('#report-study-area').on('click', 'label', function() {
        var id = $(this).attr('id');
        if (id == 'report-study-area-radius') {
          $('#report-study-area-traveltime-options').addClass('hidden');
          $('#report-study-area-radius-options').toggleClass('hidden');
        } else if (id == 'report-study-area-travel') {
          $('#report-study-area-radius-options').addClass('hidden');
          $('#report-study-area-traveltime-options').toggleClass('hidden');
        } else {
          $('#report-study-area-radius-options').addClass('hidden');
          $('#report-study-area-traveltime-options').addClass('hidden');
        }
      });

      // Bind reportModel
      $report_title.on( "input", function() {
        reportModel.title = $( this ).val();
        reportModel.notifyChange();
      });

      $report_output_format.change(function() {
        reportModel.outputFormat = $(this).val();
        reportModel.notifyChange();
      });

      $report_study_area.change(function() {
        reportModel.studyAreaType = $(this).val();
        reportModel.notifyChange();
      });

      $radius_1.on("input", function() {
        reportModel.ring1Radius = $(this).val();
        reportModel.notifyChange();
      });

      $radius_2.on("input", function() {
        reportModel.ring2Radius = $(this).val();
        reportModel.notifyChange();
      });

      $radius_3.on("input", function() {
        reportModel.ring3Radius = $(this).val();
        reportModel.notifyChange();
      });

      $('#report-study-area-radius-2-toggle').change(function() {
        if($(this).is(':checked')) {
          $radius_2.attr('disabled', false);
          $radius_2.parent().removeClass('disabled');

          reportModel.useRing2 = true;
          reportModel.notifyChange();
        } else {
          $radius_2.attr('disabled', true);
          $radius_2.parent().addClass('disabled');

          reportModel.useRing2 = false;
          reportModel.notifyChange();
        }
      });

      $('#report-study-area-radius-3-toggle').change(function() {
        if($(this).is(':checked')) {
          $radius_3.attr('disabled', false);
          $radius_3.parent().removeClass('disabled');

          reportModel.useRing3 = true;
          reportModel.notifyChange();
        } else {
          $radius_3.attr('disabled', true);
          $radius_3.parent().addClass('disabled');

          reportModel.useRing3 = false;
          reportModel.notifyChange();
        }
      });

      $traveltime_1.on("input", function() {
        reportModel.driveTime1 = $(this).val();
        reportModel.notifyChange();
      });

      $traveltime_2.on("input", function() {
        reportModel.driveTime2 = $(this).val();
        reportModel.notifyChange();
      });

      $traveltime_3.on("input", function() {
        reportModel.driveTime3 = $(this).val();
        reportModel.notifyChange();
      });

      $('#report-study-area-traveltime-2-toggle').change(function() {
        if($(this).is(':checked')) {
          $traveltime_2.attr('disabled', false);
          $traveltime_2.parent().removeClass('disabled');

          reportModel.useDriveTime2 = true;
          reportModel.notifyChange();
        } else {
          $traveltime_2.attr('disabled', true);
          $traveltime_2.parent().addClass('disabled');

          reportModel.useDriveTime2 = false;
          reportModel.notifyChange();
        }
      });

      $('#report-study-area-traveltime-3-toggle').change(function() {
        if($(this).is(':checked')) {
          $traveltime_3.attr('disabled', false);
          $traveltime_3.parent().removeClass('disabled');

          reportModel.useDriveTime3 = true;
          reportModel.notifyChange();
        } else {
          $traveltime_3.attr('disabled', true);
          $traveltime_3.parent().addClass('disabled');

          reportModel.useDriveTime3 = false;
          reportModel.notifyChange();
        }
      });

      reportModel.onChange(function() {
        if(reportModel.isValid()) {
          $create_report_button.attr('disabled', false);
        } else {
          $create_report_button.attr('disabled', true);
        }
      });
      
      $create_report_button.on('click', createReport);

      // Populate list of reports.
      $.when(
        $.getJSON("gt/esriReportCatalog")
      ).then(
        function(catalog) {
          var $report_list = $('#report-list');

          var $activeListing = null;

          var toggleActiveListing = function($newActive, reportData) {
            if($activeListing) { $activeListing.removeClass('active'); };
            $newActive.addClass("active");
            $activeListing = $newActive;

            if(reportModel.title == '') {
              $report_title.attr("placeholder", reportData.metadata.name);
            }

            setReport(reportData);
          };

          for(var i = 0; i < catalog.reports.length; i++) {
            (function() {
              var reportData = catalog.reports[i];
              var metadata = reportData.metadata;
              
              var descriptions = [];
              
              if(metadata.dataVintageDescription != "N/A") {
                descriptions.push(metadata.dataVintageDescription);
              } 

              if(metadata.boundaryVintageDescription != "N/A") {
                descriptions.push(metadata.boundaryVintageDescription);
              }

              reportData.description = descriptions.join(' ');

              var listingTemplate = Handlebars.compile($('#report-listing-template').html());
              $report_list.append(listingTemplate(reportData));
              var $listing = $('#report-' + reportData.reportID, $report_list);

              $listing.on("click", function() {
                toggleActiveListing($(this), reportData);
              });

              if(i == 0) {
                toggleActiveListing($listing, reportData);
              }
            })();
          };
        }
      );
    },
    
    setLocation : function(latlng, address) {
      reportModel.reset();

      reportModel.lat = latlng.lat;
      reportModel.lng = latlng.lng;
      reportModel.address = address
      reportModel.notifyChange();

      pushReportModelToUI();
    }
  };
});
