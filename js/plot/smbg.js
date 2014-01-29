module.exports = function(pool, opts) {

  var opts = opts || {};

  var defaults = {
    classes: {
      'very-low': 60,
      'low': 80,
      'target': 180,
      'high': 200,
      'very-high': 300
    },
    xScale: pool.xScale().copy(),
    yScale: d3.scale.linear().domain([0, 400]).range([pool.height(), 0])
  };

  _.defaults(opts, defaults);

  function cbg(selection) {
    selection.each(function(currentData) {
      var circles = d3.select(this)
        .selectAll('circle')
        .data(currentData, function(d) {
          // leveraging the timestamp of each datapoint as the ID for D3's binding
          return d.utcTimestamp;
        });
      circles.enter()
        .append('circle')
        .attr({
          'cx': function(d) {
            return opts.xScale(Date.parse(d.utcTimestamp));
          },
          'class': function(d) {
            if (d.value < opts.classes['low']) {
              return 'd3-bg-low';
            }
            else if (d.value < opts.classes['target']) {
              return 'd3-bg-target';
            }
            else {
              return 'd3-bg-high'
            }
          },
          'cy': function(d) {
            return opts.yScale(d.value);
          },
          'r': 7,
          'id': function(d) {
            return d.utcTimestamp + ' ' + d.value;
          }
        })
        .classed({'d3-circle': true, 'd3-smbg': true});
      circles.exit().remove();
    });
  }

  return cbg; 
};