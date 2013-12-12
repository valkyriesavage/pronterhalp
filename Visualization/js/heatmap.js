/**
HeatMap Class
*/
function HeatMap(width, height, dataJson, orientationCallback, dataField) {
  this.width = width;
  this.height = height;
  // this.dataFile = dataFile;
  this.json = dataJson;
  this.callback = orientationCallback; // call back to call when updating orientation
  this.dataField = dataField;
  if (this.dataField === "printTime") {
    this.lightColor = "#EBD6FF";
    this.color = "#FF3300";
  } else if (this.dataField === "material") {
    this.lightColor = "#C2F0C2";
    this.color = "#33CC33";
  } else if (this.dataField === "surfaceArea") {
    this.lightColor = "#E0C2FF";
    this.color = "#9933FF";
  }
}

HeatMap.prototype.pixelsToOrientation = function(pixelX, pixelY, width, height) {
  var orientation = new Object();
  console.log("Convert pixels to orientation");
  orientation.xRotation = (pixelX/ width) * 360;
  orientation.yRotation = (pixelY/ height) * 360;
  // SNAP IT!
  orientation.xRotation = Math.floor(orientation.xRotation/ 20) * 20;
  orientation.yRotation = Math.floor(orientation.yRotation/ 20) * 20;
  return orientation;
}

HeatMap.prototype.addToBody = function() {  
  var width = this.width,
      height = this.height;

  // Add the canvas first
  var canvas = d3.select("#heatmaps").append("canvas");
  var pixelsToOrientation = this.pixelsToOrientation;
  var callback = this.callback;
  var dataField = this.dataField;

  // Fix the aspect ratio.
  // var ka = dy / dx, kb = height / width;
  // if (ka < kb) height = width * ka;
  // else width = height / ka;
  var json = this.json;
  var dx = 360;
  var dy = 360;
  var xOffset = 180;
  var yOffset = 180;
  var degreesPer = 20.0;
  var heatData = new Array(dy);
  for (var r= 0; r < dy; r++) {
    heatData[r] = new Array(dx);
  }
  var x, y;
  var minVal = 10000, maxVal = -10000;
  console.log("JSON LENGTH: " + json.length);
  for (i = 0; i < json.length; i++) {
    x = Math.round(parseFloat(json[i].x));
    y = Math.round(parseFloat(json[i].y));
    if (this.dataField === "printTime") {
      heatData[x+xOffset][y+yOffset] = parseFloat(json[i].printTime);
    } else if (this.dataField === "material") {
      heatData[x+xOffset][y+yOffset] = parseFloat(json[i].material);
    } else if (this.dataField === "surfaceArea") {
      heatData[x+xOffset][y+yOffset] = parseFloat(json[i].surfaceArea)/1000000000;
    }
    if (heatData[x+xOffset][y+yOffset] > maxVal) {
      maxVal = heatData[x+xOffset][y+yOffset];
    }
    if (heatData[x+xOffset][y+yOffset] < minVal) {
      minVal = heatData[x+xOffset][y+yOffset];
    }
  }

  var x = d3.scale.linear()
      .domain([0, dx])
      .range([0, width]);

  var y = d3.scale.linear()
      .domain([0, dy])
      .range([height, 0]);
  
  var color = d3.scale.linear()
      .domain([minVal, maxVal])
      .range([this.lightColor, this.color]);

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
      .on("click", function(){
    	// console.log("Hello");
    	// console.log(this);
    	console.log("Absolute Position of Canvas Element: " + this.offsetLeft + ", " + this.offsetTop)
    	console.log("Absolute Click Position: " + d3.event.clientX + ", " + d3.event.clientY );
    	var deltX = (d3.event.clientX - this.offsetLeft);
    	var deltY = (d3.event.clientY - this.offsetTop);
    	var orientation = pixelsToOrientation(deltX, deltY, width, height);
    	console.log("Relative Click Position to Canvas: " + deltX + "," + deltY);
    	callback(orientation.xRotation, orientation.yRotation, heatData, dataField);
  	  });


  // Compute the pixel colors; scaled by CSS.
  function drawImage(canvas) {
    var context = canvas.node().getContext("2d"),
        image = context.createImageData(dx, dy);

    for (var y = 0, p = -1; y < dy; ++y) {
      for (var x = 0; x < dx; ++x) {
        var c;
        if (heatData[x][y])
          c = d3.rgb(color(heatData[x][y]));
        else
          c = interpolatePositionColor(x, y);
        image.data[++p] = c.r;
        image.data[++p] = c.g;
        image.data[++p] = c.b;
        image.data[++p] = 255;
      }
    }

    context.putImageData(image, 0, 0);
  }

  function interpolatePositionColor(x, y) {
    // we have x's every degreesPer degrees
    // we have y's every degreesPer degrees
    var lowerX, upperX, lowerY, upperY;

    lowerX = x - x%degreesPer;
    upperX = lowerX + degreesPer;
    lowerY = y - y%degreesPer;
    upperY = lowerY + degreesPer;

    if (upperX >= 360) upperX = 0;
    if (upperY >= 360) upperY = 0;

    var c00, c01, c10, c11;
    c00 = d3.rgb(color(heatData[lowerX][lowerY]));
    c01 = d3.rgb(color(heatData[upperX][lowerY]));
    c10 = d3.rgb(color(heatData[lowerX][upperY]));
    c11 = d3.rgb(color(heatData[upperX][upperY]));
    return d3.rgb(interpolateBilinear(c00, c01, c10, c11)(x, y));
  }

  function interpolateBilinear(c00, c01, c10, c11) {
    var i = d3.interpolate(c00, c01),
        j = d3.interpolate(c10, c11);
    return function(u, v) {
      u = u%degreesPer/degreesPer;
      v = v%degreesPer/degreesPer;
      return d3.interpolate(i(u), j(u))(v);
    };
  }

  function removeZero(axis) {
    axis.selectAll("g").filter(function(d) { return !d; }).remove();
  }
// });
}
