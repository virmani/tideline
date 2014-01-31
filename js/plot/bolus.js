module.exports = function(pool, opts) {

  var opts = opts || {};

  var defaults = {
    xScale: pool.xScale().copy(),
    width: 12,
    recStroke: 2,
    triangleSize: 6
  };

  _.defaults(opts, defaults);

  function bolus(selection) {
    selection.each(function(currentData) {
      var boluses = d3.select(this)
        .selectAll('g')
        .data(currentData, function(d) {
          // leveraging the timestamp of each datapoint as the ID for D3's binding
          return d.normalTime;
        });
      var bolusGroups = boluses.enter()
        .append('g')
        .attr({
          'class': 'd3-bolus-group'
        });
      var top = opts.yScale.range()[0];
      bolusGroups.append('rect')
        .attr({
          'x': function(d) {
            return bolus.x(d);
          },
          'y': function(d) {
            return opts.yScale(d.value);
          },
          'width': opts.width,
          'height': function(d) {
            return top - opts.yScale(d.value);
          },
          'class': 'd3-rect-bolus d3-bolus',
          'id': function(d) {
            return d.normalTime + ' ' + d.value + ' ' + d.recommended + ' recommended';
          }
        });
      // boluses where the recommended bolus is larger than delivered bolus
      bolusGroups.filter(function(d) {
          if (d.recommended > d.value) {
            return d;
          }
        })
        .append('path')
        .attr({
          'd': function(d) {
            var leftEdge = bolus.x(d) + opts.recStroke/2;
            var rightEdge = bolus.x(d) + opts.width - opts.recStroke/2;
            var deliveredBolus = opts.yScale(d.value);
            var recommendedBolus = opts.yScale(d.recommended);

            var start = "M" + leftEdge + " " + deliveredBolus;
            var topLeft = "L" + leftEdge + " " + recommendedBolus;
            var topRight = "L" + rightEdge + " " + recommendedBolus;
            var end = "L" + rightEdge + " " + deliveredBolus;

            return start + topLeft + topRight + end;
          },
          // can't seem to set many of these attributes in CSS
          'stroke-width': opts.recStroke,
          'stroke-dasharray': '1,3',
          'stroke-linecap': 'round',
          'class': 'd3-path-recommended d3-higher d3-bolus',
          'id': function(d) {
            return d.normalTime + ' ' + d.recommended + ' recommended';
          }
        });
      // boluses where the recommended bolus is smaller than delivered bolus
      // add the little white pointer triangle
      bolusGroups.filter(function(d) {
          if (d.recommended < d.value) {
            return d;
          }
        })
        .append('path')
        .attr({
          'd': function(d) {
            var x = bolus.x(d);
            var y = opts.yScale(d.recommended);
            return bolus.triangle(x, y);
          },
          'class': 'd3-path-recommended d3-lower-triangle d3-bolus',
          'id': function(d) {
            return d.normalTime + ' ' + d.recommended + ' recommended';
          }
        });
      // add the dotted line
      bolusGroups.filter(function(d) {
          if (d.recommended < d.value) {
            return d;
          }
        })
        .append('path')
        .attr({
          'd': function(d) {
            var recced = opts.yScale(d.recommended);
            var x = bolus.x(d);
            return "M" + (x + opts.triangleSize) + ' ' + recced + "L" + (x + opts.width) + ' ' + recced;
          },
          'class': 'd3-path-recommended d3-lower d3-bolus',
          'id': function(d) {
            return d.normalTime + ' ' + d.recommended + ' recommended';
          },
          // can't seem to set many of these attributes in CSS
          'stroke-width': opts.recStroke,
          'stroke-dasharray': '1,3',
          'stroke-linecap': 'round'
        });
      boluses.exit().remove();
    });
  }

  bolus.x = function(d) {
    return opts.xScale(Date.parse(d.normalTime)) - opts.width/2;
  };

  bolus.triangle = function(x, y) {
    var top = x + ' ' + (y + opts.triangleSize/2);
    var mid = (x + opts.triangleSize) + ' ' + y;
    var bottom = x + ' ' + (y - opts.triangleSize/2);
    console.log("M" + top + "L" + mid + "L" + bottom + "Z");
    return "M" + top + "L" + mid + "L" + bottom + "Z";
  };

  return bolus; 
};