/**
Histogram class
*/
var h1_width = null, h1_height = null, h1_rects = null, h1_minVal = null, h1_maxVal = null, h1_numBuckets = null;
function HistogramOne(width, height, dataFile) {
  h1_width = width;
  h1_height = height;
  h1_minVal = 10000; 
  h1_maxVal = -10000;
  h1_numBuckets = 10;
  this.dataFile = dataFile;
}

HistogramOne.prototype.handleData = function(error, json) {
    if (error) {
        return console.warn(error);
    }
    var values = new Array(json.length);
    var x, y;
    for (i = 0; i < json.length; i++) {
      values[i] = parseFloat(json[i].printTime);
      if (values[i] > h1_maxVal) {
        h1_maxVal = values[i];
      }
      if (values[i] < h1_minVal) {
        h1_minVal = values[i];
      }
    }  
    var width, height;

    // A formatter for counts.
    var formatCount = d3.format(",.0f");

    var margin = {top: 10, right: 30, bottom: 30, left: 30},
        width = h1_width - margin.left - margin.right,
        height = h1_height - margin.top - margin.bottom;

    var x = d3.scale.linear()
        .domain([h1_minVal, h1_maxVal])
        .range([0, width]);

    // Generate a histogram using twenty uniformly-spaced bins.
    var data = d3.layout.histogram()
        .bins(x.ticks(h1_numBuckets))
        (values);
    console.log(data);

    var y = d3.scale.linear()
        .domain([0, d3.max(data, function(d) { return d.y; })])
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var svg = d3.select("#histograms").append("svg")
        .attr("class", "histogram")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var bar = svg.selectAll(".bar")
        .data(data)
      .enter().append("g")
        .attr("class", "bar")
        .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

    h1_rects = bar.append("rect")
        .attr("x", 1)
        .attr("width", x(h1_minVal +data[0].dx) - 1)
        .attr("height", function(d) { return height - y(d.y); })
        ;

    bar.append("text")
        .attr("dy", ".75em")
        .attr("y", 6)
        .attr("x", x(h1_minVal + data[0].dx) / 2)
        .attr("text-anchor", "middle")
        .text(function(d) { return formatCount(d.y); });

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);
  }
  // DERRICK TEST
  // h1_highlightBar(0.6);
  // console.log(h1_rects);
  // h1_rects.filter(function(d) { return d.x < 0.5 }).style("fill", "green");

HistogramOne.prototype.addToBody = function() {  
  d3.json(this.dataFile, this.handleData)
}

/**
 Given a value highlights the associated bar
 Only should be called after addToBody has been called
 */
HistogramOne.prototype.highlightBar = function(v) {
  var step = (h1_maxVal - h1_minVal) / h1_numBuckets;
  var left = 0;
  var right = 0;
  var curV;
  for (var i = 0; i< h1_numBuckets; i++) {
    curV = h1_minVal + step*(i+1);
    if (curV > v) {
      right = (h1_minVal + step*(i+1));
      left = right - step;
      break;
    }
  } 
  // clear the previous highlights
  h1_rects.style("fill", "steelblue");
  console.log("V: " + v + " minVal:" + h1_minVal + " numBuckets:" + h1_numBuckets + " Step:" + step + " Left: " + left + " Right: " + right);
  // highlight the bar
  h1_rects.filter(function(d) { console.log("d.x:" + d.x); return left <= d.x && d.x < right;}).style("fill", "green");
}