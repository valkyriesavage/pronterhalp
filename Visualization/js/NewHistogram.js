/**
Histogram class
*/
function NewHistogram(width, height) {
  this.width = width;
  this.height = height;
}

NewHistogram.prototype.addToBody = function() {  
  var width, height;
  // Generate an Irwin–Hall distribution of 10 random variables.
  var values = d3.range(5).map(d3.random.irwinHall(10));
  // var values = new Array();
  // d3.json("data/wizzard.json", function(error, json) {
  //   if (error) {
  //     return console.warn(error);
  //   }
  //   for (i = 0; i < json.length; i++) {
  //     values[i] = parseFloat(json[i].printTime);
  //   }
  //   console.log("data json");
  //   // d3.data(json).enter().map(function(d) {return d.printTime});
  // });
  

  // A formatter for counts.
  var formatCount = d3.format(",.0f");

  var margin = {top: 10, right: 30, bottom: 30, left: 30},
      width = this.width - margin.left - margin.right,
      height = this.height - margin.top - margin.bottom;

  var x = d3.scale.linear()
      .domain([0, 1])
      .range([0, width]);

  // Generate a histogram using twenty uniformly-spaced bins.
  var data = d3.layout.histogram()
      .bins(x.ticks(10))
      (values);

  var y = d3.scale.linear()
      .domain([0, d3.max(data, function(d) { console.log(d.y); return d.y; })])
      .range([height, 0]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

  var svg = d3.select("body").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var bar = svg.selectAll(".bar")
      .data(data)
    .enter().append("g")
      .attr("class", "bar")
      .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

  bar.append("rect")
      .attr("x", 1)
      .attr("width", x(data[0].dx) - 1)
      .attr("height", function(d) { return height - y(d.y); });

  bar.append("text")
      .attr("dy", ".75em")
      .attr("y", 6)
      .attr("x", x(data[0].dx) / 2)
      .attr("text-anchor", "middle")
      .text(function(d) { return formatCount(d.y); });

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);
}