/**
Histogram class
*/
function Histogram(width, height, dataFile) {
  this.width = width;
  this.height = height;
  this.dataFile = dataFile;
}

Histogram.prototype.addToBody = function() {  
  width = this.width;
  height = this.height;
  var x = d3.scale.ordinal()
      .rangeRoundBands([0, width], .1);

  var y = d3.scale.linear()
      .range([height, 0]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .ticks(10, "%");

  var svg = d3.select("body").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // DERRICK
  console.log("hello!");
  // console.log(wizzardData);
  // var data;
  // d3.json("data/wizzard.json", function(error, json) {
  //   if (error) {
  //     return console.warn(error);
  //   }
  //   data = json;
  //   console.log("data json");
  // });

  d3.tsv(this.dataFile, this.type, function(error, data) {
    x.domain(data.map(function(d) { return d.letter; }));
    y.domain([0, d3.max(data, function(d) { return d.frequency; })]);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Frequency");

    svg.selectAll(".bar")
        .data(data)
      .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d.letter); })
        .attr("width", x.rangeBand())
        .attr("y", function(d) { return y(d.frequency); })
        .attr("height", function(d) { return height - y(d.frequency); });
  });
}

Histogram.prototype.type = function (d) {
  d.frequency = +d.frequency;
  return d;
}