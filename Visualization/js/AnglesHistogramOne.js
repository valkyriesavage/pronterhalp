/**
Angles Histogram class
*/
function AnglesHistogramOne(width, height, dataJsonArray, dataField) {
  this.width = width;
  this.height = height;
  this.jsonArray = dataJsonArray;
  this.dataField = dataField;
  if (this.dataField === "angles") {
    this.color = "#00008B";
  }
  this.resetVars();
}

AnglesHistogramOne.prototype.resetVars = function() {
  this.minVal = 10000; 
  this.maxVal = -10000;
  this.numBuckets = 10;
}

AnglesHistogramOne.prototype.reAddToBody = function (x,y) {
  this.resetVars();
  $("#h-"+this.dataField).remove();
  this.addToBody(x,y);
}

AnglesHistogramOne.prototype.addToBody = function(x, y) { 
  var angles;
  var jsonArray = this.jsonArray;
  var values = new Array();
  var x, y;
  var xOffset = 180;
  var yOffset = 180;
  for (i = 0; i < jsonArray.length; i++) {
    x_s = parseFloat(jsonArray[i].x);
    y_s = parseFloat(jsonArray[i].y);
    if (x_s === x && y_s === y) {
      angles = jsonArray[i].angles;
      break;
    }
  } 

  var ang, angCt;
  for (var j = 0; j < angles.length; j++) { 
      ang = parseFloat(angles[j][0]);
      angCt = parseFloat(angles[j][1]);
      if (ang > this.maxVal) {
        this.maxVal = ang;
      }
      if (ang < this.minVal) {
        this.minVal = ang;
      }
      while (angCt > 0) {
        values.push(ang);
        angCt = angCt - 1;
      }
  }
  var width, height;

  // A formatter for counts.
  var formatCount = d3.format(",.0f");

  var margin = {top: 10, right: 30, bottom: 30, left: 30},
      width = this.width - margin.left - margin.right,
      height = this.height - margin.top - margin.bottom;

  var x = d3.scale.linear()
      .domain([this.minVal, this.maxVal])
      .range([0, width]);

  // Generate a histogram using twenty uniformly-spaced bins.
  var data = d3.layout.histogram()
      .bins(x.ticks(this.numBuckets))
      (values);

  var y = d3.scale.linear()
      .domain([0, d3.max(data, function(d) { return d.y; })])
      .range([height, 0]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

  var histo = d3.select("#anglesHistogram").append("div").attr("id", "h-"+this.dataField);
  histo.append("span").attr("id", "h-"+this.dataField+"-text").text(this.dataField);
  var svg = histo
      .append("svg")
      .attr("class", "anglesHistogram")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var padding = 80;

  var unitsLabel = "";
  if (this.dataField === "angles") {
    unitsLabel = "(in degrees)";
  }

  svg.append("text")
    .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
    .attr("transform", "translate("+ (width/2) +","+(height+(padding/3))+")")  // centre below axis
    .text(unitsLabel);
 
  this.bar = svg.selectAll(".bar")
      .data(data)
    .enter().append("g")
      .attr("class", "bar")
      .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

  this.rects = this.bar.append("rect")
      .attr("x", 1)
      .attr("width", x(this.minVal +data[0].dx) - 1)
      .attr("height", function(d) { return height - y(d.y); })
      ;

  // this.bar.append("text")
  //     .attr("dy", ".75em")
  //     .attr("y", 6)
  //     .attr("x", x(this.minVal + data[0].dx) / 2)
  //     .attr("text-anchor", "middle")
  //     .text(function(d) { return formatCount(d.y); });

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  this.rects.style("fill", this.color);
}

/**
Updates itself given the correct x,y
 */
AnglesHistogramOne.prototype.updateData = function(x, y) {

}