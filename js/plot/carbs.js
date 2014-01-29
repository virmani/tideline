module.exports = function(pool, opts) {

  var opts = opts || {};

  var defaults = {
    xScale: pool.xScale().copy(),
    width: 8
  };

  _.defaults(opts, defaults);

  function carbs(selection) {
    selection.each(function(currentData) {
      var rects = d3.select(this)
        .selectAll('rect')
        .data(currentData, function(d) {
          // leveraging the timestamp of each datapoint as the ID for D3's binding
          return d.utcTimestamp;
        });
      rects.enter()
        .append('rect')
        .attr({
          'x': function(d) {
            return opts.xScale(Date.parse(d.utcTimestamp)) - opts.width/2;
          },
          'y': 0,
          'width': opts.width,
          'height': function(d) {
            return opts.yScale(d.value);
          },
          'class': 'd3-rect-carbs d3-carbs',
          'id': function(d) {
            return d.utcTimestamp + ' ' + d.value;
          }
        });
        rects.exit().remove();
    });
  }

  return carbs; 
};