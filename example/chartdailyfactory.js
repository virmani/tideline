/* 
 * == BSD2 LICENSE ==
 * Copyright (c) 2014, Tidepool Project
 * 
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the associated License, which is identical to the BSD 2-Clause
 * License as published by the Open Source Initiative at opensource.org.
 * 
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the License for more details.
 * 
 * You should have received a copy of the License along with this program; if
 * not, you can obtain one from Tidepool Project at tidepool.org.
 * == BSD2 LICENSE ==
 */

var bows = window.bows;

var tideline = require('../js');

var fill = tideline.plot.util.fill;
var scales = tideline.plot.util.scales;

// Create a 'One Day' chart object that is a wrapper around Tideline components
function chartDailyFactory(el, options, emitter) {
  var log = bows('Daily Factory');
  options = options || {};

  var chart = tideline.oneDay(el, emitter);
  chart.emitter = emitter;

  var poolMessages, poolBG, poolBolus, poolBasal, poolStats;

  var create = function(el, options) {
    // basic chart set up
    chart.width($(el).width()).height($(el).height());

    if (options.imagesBaseUrl) {
      chart.imagesBaseUrl(options.imagesBaseUrl);
    }

    d3.select(el).call(chart);

    return chart;
  };

  chart.setupPools = function() {
    // messages pool
    poolMessages = chart.newPool()
      .id('poolMessages', chart.poolGroup())
      .label('')
      .index(chart.pools().indexOf(poolMessages))
      .weight(0.5);

    // blood glucose data pool
    poolBG = chart.newPool()
      .id('poolBG', chart.poolGroup())
      .label('Blood Glucose')
      .index(chart.pools().indexOf(poolBG))
      .weight(1.5);

    // carbs and boluses data pool
    poolBolus = chart.newPool()
      .id('poolBolus', chart.poolGroup())
      .label('Bolus & Carbohydrates')
      .index(chart.pools().indexOf(poolBolus))
      .weight(1.5);
    
    // basal data pool
    poolBasal = chart.newPool()
      .id('poolBasal', chart.poolGroup())
      .label('Basal Rates')
      .index(chart.pools().indexOf(poolBasal))
      .weight(1.0);

    chart.arrangePools();

    chart.setTooltip();

    // add tooltips
    chart.tooltips().addGroup(d3.select('#' + poolBG.id()), 'cbg');
    chart.tooltips().addGroup(d3.select('#' + poolBG.id()), 'smbg');
    chart.tooltips().addGroup(d3.select('#' + poolBolus.id()), 'carbs');
    chart.tooltips().addGroup(d3.select('#' + poolBolus.id()), 'bolus');
    chart.tooltips().addGroup(d3.select('#' + poolBasal.id()), 'basal');

    return chart;
  };

  chart.load = function(data, datetime) {
    chart.stopListening();
    // initialize chart with data
    chart.data(data).setAxes().setNav().setScrollNav();

    // BG pool
    var scaleBG = scales.bg(_.filter(data, function(d) {
      if ((d.type === 'cbg') || (d.type === 'smbg')) {
        return d;
      }
    }), poolBG);
    // set up y-axis
    poolBG.yAxis(d3.svg.axis()
      .scale(scaleBG)
      .orient('left')
      .outerTickSize(0)
      .tickValues([40, 80, 120, 180, 300]));
    // add background fill rectangles to BG pool
    poolBG.addPlotType('fill', fill(poolBG, {endpoints: chart.endpoints}), false);

    // add CBG data to BG pool
    poolBG.addPlotType('cbg', tideline.plot.cbg(poolBG, {yScale: scaleBG}), true);

    // add SMBG data to BG pool
    poolBG.addPlotType('smbg', tideline.plot.smbg(poolBG, {yScale: scaleBG}), true);

    // bolus & carbs pool
    var scaleBolus = scales.bolus(_.where(data, {'type': 'bolus'}), poolBolus);
    var scaleCarbs = scales.carbs(_.where(data, {'type': 'carbs'}), poolBolus);
    // set up y-axis for bolus
    poolBolus.yAxis(d3.svg.axis()
      .scale(scaleBolus)
      .orient('left')
      .outerTickSize(0)
      .ticks(3));
    // set up y-axis for carbs
    poolBolus.yAxis(d3.svg.axis()
      .scale(scaleCarbs)
      .orient('left')
      .outerTickSize(0)
      .ticks(3));
    // add background fill rectangles to bolus pool
    poolBolus.addPlotType('fill', fill(poolBolus, {endpoints: chart.endpoints}), false);

    // add carbs data to bolus pool
    poolBolus.addPlotType('carbs', tideline.plot.carbs(poolBolus, {
      yScale: scaleCarbs,
      emitter: emitter,
      data: _.where(data, {'type': 'carbs'})
    }), true);

    // add bolus data to bolus pool
    poolBolus.addPlotType('bolus', tideline.plot.bolus(poolBolus, {
      yScale: scaleBolus,
      emitter: emitter,
      data: _.where(data, {'type': 'bolus'})
    }), true);

    // basal pool
    var scaleBasal = scales.basal(_.where(data, {'type': 'basal-rate-segment'}), poolBasal);
    // set up y-axis
    poolBasal.yAxis(d3.svg.axis()
      .scale(scaleBasal)
      .orient('left')
      .outerTickSize(0)
      .ticks(4));
    // add background fill rectangles to basal pool
    poolBasal.addPlotType('fill', fill(poolBasal, {endpoints: chart.endpoints}), false);

    // add basal data to basal pool
    poolBasal.addPlotType('basal-rate-segment', tideline.plot.basal(poolBasal, {yScale: scaleBasal, data: _.where(data, {'type': 'basal-rate-segment'}) }), true);

    // messages pool
    // add background fill rectangles to messages pool
    poolMessages.addPlotType('fill', fill(poolMessages, {endpoints: chart.endpoints}), false);

    // add message images to messages pool
    poolMessages.addPlotType('message', tideline.plot.message(poolMessages, {size: 30}), true);

    return chart;
  };

  // locate the chart around a certain datetime
  // if called without an argument, locates the chart at the most recent 24 hours of data
  chart.locate = function(datetime) {

    var start, end, localData;

    var mostRecent = function() {
      start = chart.initialEndpoints[0];
      end = chart.initialEndpoints[1];
      localData = chart.getData(chart.initialEndpoints, 'both');
    };

    if (!arguments.length) {
      mostRecent();
    }
    else {
      start = new Date(datetime);
      var plusHalf = new Date(start);
      plusHalf.setUTCHours(plusHalf.getUTCHours() + 12);
      var minusHalf = new Date(start);
      minusHalf.setUTCHours(minusHalf.getUTCHours() - 12);
      if ((start.valueOf() < chart.endpoints[0]) || (start.valueOf() > chart.endpoints[1])) {
        log('Please don\'t ask tideline to locate at a date that\'s outside of your data!');
        log('Rendering most recent data instead.');
        mostRecent();
      }
      else if (plusHalf.valueOf() > chart.endpoints[1]) {
        mostRecent();
      }
      else if (minusHalf.valueOf() < chart.endpoints[0]) {
        start = chart.endpoints[0];
        var firstEnd = new Date(start);
        firstEnd.setUTCDate(firstEnd.getUTCDate() + 1);
        end = firstEnd;
        localData = chart.getData([start, firstEnd], 'both');
      }
      else {
        end = new Date(start);
        start.setUTCHours(start.getUTCHours() - 12);
        end.setUTCHours(end.getUTCHours() + 12);

        localData = chart.getData([start, end], 'both');
      }
    }

    chart.beginningOfData(start).endOfData(end);
    chart.allData(localData, [start, end]);

    chart.setAtDate(start);

    // render pools
    chart.pools().forEach(function(pool) {
      pool.render(chart.poolGroup(), localData);
    });

    return chart;
  };

  chart.getCurrentDay = function() {
    return chart.getCurrentDomain().end;
  };

  return create(el, options);
}

module.exports = chartDailyFactory;