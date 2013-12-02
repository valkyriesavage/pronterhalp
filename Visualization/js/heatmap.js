/**
HeatMap Class
*/
function HeatMap(width, height, dataFile, orientationCallback) {
  this.width = width;
  this.height = height;
  this.dataFile = dataFile;
  this.callback = orientationCallback; // call back to call when updating orientation
}

HeatMap.prototype.pixelsToOrientation = function(pixelX, pixelY) {
	var orientation = new Object();
	console.log("Convert pixels to orientation");
	orientation.xRotation = pixelX;
	orientation.yRotation = pixelY;
	return orientation;
}

HeatMap.prototype.addToBody = function() {  
var width = this.width,
    height = this.height;

// Add the canvas first
var canvas = d3.select("#heatmaps").append("canvas");
var pixelsToOrientation = this.pixelsToOrientation;
var callback = this.callback;

d3.json(this.dataFile, function(error, heatmap) {
  var dx = heatmap[0].length,
      dy = heatmap.length;

  // Fix the aspect ratio.
  // var ka = dy / dx, kb = height / width;
  // if (ka < kb) height = width * ka;
  // else width = height / ka;

  var x = d3.scale.linear()
      .domain([0, dx])
      .range([0, width]);

  var y = d3.scale.linear()
      .domain([0, dy])
      .range([height, 0]);

  var color = d3.scale.linear()
      .domain([95, 115, 135, 155, 175, 195])
      .range(["#0a0", "#6c0", "#ee0", "#eb4", "#eb9", "#fff"]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("top")
      .ticks(20);

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("right");

  canvas.attr("class", "heatmap")
      .attr("width", dx)
      .attr("height", dy)
      .style("width", width + "px")
      .style("height", height + "px")
      .call(drawImage)
      .on("mousemove", function(){
    	// console.log("Hello");
    	// console.log(this);
    	console.log("Absolute Position of Canvas Element: " + this.offsetLeft + ", " + this.offsetTop)
    	console.log("Absolute Click Position: " + d3.event.clientX + ", " + d3.event.clientY );
    	var dX = (d3.event.clientX - this.offsetLeft);
    	var dY = (d3.event.clientY - this.offsetTop);
    	var orientation = pixelsToOrientation(dX, dY);
    	console.log("Relative Click Position to Canvas: " + dX + "," + dY);
    	callback(orientation.xRotation, orientation.yRotation);
  	  });


  // var svg = d3.select("body").append("svg")
  //     .attr("width", width)
  //     .attr("height", height);

  // svg.append("g")
  //     .attr("class", "x axis")
  //     .attr("transform", "translate(0," + height + ")")
  //     .call(xAxis)
  //     .call(removeZero);

  // svg.append("g")
  //     .attr("class", "y axis")
  //     .call(yAxis)
  //     .call(removeZero);

  // Compute the pixel colors; scaled by CSS.
  function drawImage(canvas) {
    var context = canvas.node().getContext("2d"),
        image = context.createImageData(dx, dy);

    for (var y = 0, p = -1; y < dy; ++y) {
      for (var x = 0; x < dx; ++x) {
        var c = d3.rgb(color(heatmap[y][x]));
        image.data[++p] = c.r;
        image.data[++p] = c.g;
        image.data[++p] = c.b;
        image.data[++p] = 255;
      }
    }

    context.putImageData(image, 0, 0);
  }

  function removeZero(axis) {
    axis.selectAll("g").filter(function(d) { return !d; }).remove();
  }
});
}