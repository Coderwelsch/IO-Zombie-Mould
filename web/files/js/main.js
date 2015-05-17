// global vars
var RESOLUTION_X = 640,
    RESOLUTION_Y = 370;

var cvData = {},
    processedCVData = [],
    visualizationData = [ [ 'Land', 'Infektionsrate' ] ],
    visualizationArray = [],
    $map,
    $loadingScreen,
    $progressLabel;

// init fix
var initInterval = setInterval( function () {
    if ( $ && window.googleLoaded ) {
        init();

        clearInterval( initInterval );
    }
}, 100 );

google.load( "visualization", "1", { packages: [ "geochart" ] } );
google.setOnLoadCallback( visualizationLoaded );

function visualizationLoaded () {
    window.googleLoaded = true;
}

function initVars () {
    $map = $( '#google-map' );
    $loadingScreen = $( '#loading-screen' );
    $progressLabel = $loadingScreen.find( '.progress-label' );
}

// main functions
function loadCVData () {
    $progressLabel.text( 'Analysiere die gemeldeten Infektionen...' );

    $.getJSON( 'files/json/exported.json', cvDataLoaded );
}

function cvDataLoaded ( data ) {
    cvData = data;

    prepareCVData();
}

function initVisualisationMap () {
    var infections = 0;
    var infectedCountries = 0;
    
    for ( var item in visualizationData ) {
        if ( !isNaN( visualizationData[ item ][ 1 ] ) ) {
            infections += visualizationData[ item ][ 1 ];
            infectedCountries++;
        }
    }

    $progressLabel.text( 'Infektionen: ' + infections + ', Betroffene Länder: ' + infectedCountries );

    var chart = new google.visualization.GeoChart( $map[ 0 ] );
    chart.draw( visualizationArray, {
        region: 'world',
        showZoomOut: true,
        showLegend: true,
        colorAxis: { colors: [ '#FFD1D2', '#F21B1E', '#A60508' ] },
        defaultColor: '#FFFFFF',
        backgroundColor: '#81D4FA'
    } );

    $loadingScreen.addClass( 'hide' );
}

function mapLatitute ( minA, maxA, a ) {
    var min = 0;
    var max = 90;
    var range = max - min;
    var arange = maxA - minA;

    var value = ( a / arange ) * range

    value = value < min ? min : value;
    value = value > max ? max : value;

    return value;
}

function mapLongtitute ( minA, maxA, a ) {
    var min = 0;
    var max = 180;
    var range = max - min;
    var arange = maxA - minA;

    var value = ( a / arange ) * range

    value = value < min ? min : value;
    value = value > max ? max : value;

    return value;
}

function prepareCVData () {
    $progressLabel.text( 'Verwerte geladene Daten...' );

    var respondedRequests = 0;
    var requestsToFetch = 0;

    function createChartData () {
        var data = {};
        for ( var item in processedCVData ) {
            if ( processedCVData.hasOwnProperty( item ) ) {
                item = processedCVData[ item ];

                if ( data[ item.countryName ] ) {
                    data[ item.countryName ] +=  1;
                } else {
                    data[ item.countryName ] = 1;
                }
            }
        }

        for ( var item in data ) {
            if ( data.hasOwnProperty( item ) ) {
                visualizationData.push( [ item, data[ item ] * 100 ] );
            }
        }

        visualizationArray = google.visualization.arrayToDataTable( visualizationData );
        initVisualisationMap();
    }

    // get length of data
    for ( var item in cvData ) {
        if ( !cvData.hasOwnProperty( item ) ) {
            return true;
        }
        
        requestsToFetch++;
    }

    // ajax requests
    for ( var item in cvData ) {
        if ( !cvData.hasOwnProperty( item ) ) {
            return true;
        }

        item = cvData[ item ];

        $.ajax( {
            url: '//api.geonames.org/countryCodeJSON?lat=' + mapLatitute( 0, RESOLUTION_Y, item[ 1 ] ) + '&lng=' + mapLongtitute( 0, RESOLUTION_X, item[ 0 ] ) + '&username=coderwelsch',
            dataType: 'json',
            success: function ( data ) {
                var processedItem = {
                    countryName: '',
                    countryCode: '',
                    lat: mapLatitute( 0, RESOLUTION_Y, item[ 1 ] ),
                    lng: mapLongtitute( 0, RESOLUTION_X, item[ 0 ] )
                };

                if ( 'countryName' in data ) {
                    processedItem.countryName = data.countryName;
                    processedItem.countryCode = data.countryCode;

                    processedCVData.push( processedItem );  
                }

                respondedRequests++;

                $progressLabel.text( 'Verwerte geladene Daten ( ' + respondedRequests + ' / ' + requestsToFetch + ' )' );

                if ( respondedRequests === requestsToFetch ) {
                    createChartData();
                }
            }
        } );
    }
}

function init () {
    initVars();

    loadCVData();
}