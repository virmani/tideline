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

var _ = require('../lib/lodash');
var log = require('../lib/bows')('BolusUtil');

function BolusUtil(data) {

  function fixFloatingPoint (n) {
    return parseFloat(n.toFixed(3));
  }

  this.totalBolus = function(s, e) {
    var dose = 0.0;
    var firstBolus = _.find(this.data, function(bolus) {
      var d = new Date(bolus.normalTime).valueOf();
      return (d >= s) && (d <= e);
    });
    if (firstBolus) {
      var index = this.data.indexOf(firstBolus);
      while (index < (data.length - 1) && (new Date(this.data[index].normalTime).valueOf() <= e)) {
        var bolus = this.data[index];
        dose += bolus.value;
        index++;
      }
    }
    return fixFloatingPoint(dose);
  };

  this.data = data;
}

module.exports = BolusUtil;