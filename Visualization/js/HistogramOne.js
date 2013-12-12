/**
Histogram class
*/
function HistogramOne(width, height, dataJson, dataField) {
  this.width = width;
  this.height = height;
  this.minVal = 10000; 
  this.maxVal = -10000;
  this.numBuckets = 10;
  this.json = dataJson;
  this.dataField = dataField;
  var dx = 360/20;
  var dy = 360/20;
  this.matrix = new Array(dy);
  for (var r= 0; r < dx; r++) {
    this.matrix[r] = new Array(dy);
  }
  if (this.dataField === "printTime") {
    this.color = "#FF3300";
    this.highlightColor = "#801A00";
  } else if (this.dataField === "material") {
    this.color = "#33CC33";
    this.highlightColor = "#006600";
  } else if (this.dataField === "surfaceArea") {
    this.color = "#9933FF";
    this.highlightColor = "#3D1466";
  }
}

HistogramOne.prototype.addToBody = function() {  
  var json = this.json;
  var values = new Array(json.length);
  var x, y;
  var xOffset = 180;
  var yOffset = 180;
  for (i = 0; i < json.length; i++) {
    x = parseFloat(json[i].x);
    y = parseFloat(json[i].y);
    if (this.dataField === "printTime") {
      values[i] = parseFloat(json[i].printTime);
    } else if (this.dataField === "material") {
      values[i] = parseFloat(json[i].material);
    } else if (this.dataField === "surfaceArea") {
      values[i] = parseFloat(json[i].surfaceArea)/1000000000;
    }
    this.matrix[(x + xOffset)/20][(y + yOffset)/20] = values[i];
    if (values[i] > this.maxVal) {
      this.maxVal = values[i];
    }
    if (values[i] < this.minVal) {
      this.minVal = values[i];
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
  // TODO: DERRICK

  var histo = d3.select("#histograms").append("div").attr("id", "h-"+this.dataField);
  histo.append("span").attr("id", "h-"+this.dataField+"-text").text(this.dataField);
  var svg = histo
      .append("svg")
      .attr("class", "histogram")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var padding = 80;
  svg.append("text")
    .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
    .attr("transform", "translate("+ (width/2) +","+(height+(padding/3))+")")  // centre below axis
    .text("");

  var bar = svg.selectAll(".bar")
      .data(data)
    .enter().append("g")
      .attr("class", "bar")
      .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

  this.rects = bar.append("rect")
      .attr("x", 1)
      .attr("width", x(this.minVal +data[0].dx) - 1)
      .attr("height", function(d) { return height - y(d.y); })
      ;

  bar.append("text")
      .attr("dy", ".75em")
      .attr("y", 6)
      .attr("x", x(this.minVal + data[0].dx) / 2)
      .attr("text-anchor", "middle")
      .text(function(d) { return formatCount(d.y); });

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  this.rects.style("fill", this.color);
}

/**
 Given a value highlights the associated bar
 Only should be called after addToBody has been called
 */
HistogramOne.prototype.highlightBar = function(x, y) {
  var v = this.matrix[x/20][y/20];
  var buckets = this.rects[0].length;
  var step = (this.maxVal - this.minVal) / buckets;
  var left = 0;
  var right = 0;
  var curV;
  for (var i = 0; i< buckets; i++) {
    curV = this.minVal + step*(i+1);
    if (curV > v) {
      right = curV;
      left = right - step;
      break;
    }
  } 
  // clear the previous highlights
  this.rects.style("fill", this.color);
  // highlight the bar
  console.log("Left: " + left + " Right: " + right);
  this.rects.filter(function(d) { return d.x <= v && v < d.x + d.dx}).style("fill", this.highlightColor);
  $("#h-"+this.dataField+"-text").text(this.dataField + ": " + parseFloat(Math.round(v*100)/100).toFixed(3));
}
