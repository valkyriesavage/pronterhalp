/**
STL Model Class
*/
function STLModel(width, height) {
  this.width = width;
  this.height = height;
}

STLModel.prototype.addToBody = function() {

  var camera, scene, renderer, geometry, material, mesh, light1, stats, controls;

	function trim (str) {
	str = str.replace(/^\s+/, '');
	for (var i = str.length - 1; i >= 0; i--) {
	    if (/\S/.test(str.charAt(i))) {
	        str = str.substring(0, i + 1);
	        break;
	    }
	}
	return str;
	}

	// Notes:
	// - STL file format: http://en.wikipedia.org/wiki/STL_(file_format)
	// - 80 byte unused header
	// - All binary STLs are assumed to be little endian, as per wiki doc
	var parseStlBinary = function(stl) {
	var geo = new THREE.Geometry();
	var dv = new DataView(stl, 80); // 80 == unused header
	var isLittleEndian = true;
	var triangles = dv.getUint32(0, isLittleEndian); 

	// console.log('arraybuffer length:  ' + stl.byteLength);
	// console.log('number of triangles: ' + triangles);

	var offset = 4;
	for (var i = 0; i < triangles; i++) {
	    // Get the normal for this triangle
	    var normal = new THREE.Vector3(
	        dv.getFloat32(offset, isLittleEndian),
	        dv.getFloat32(offset+4, isLittleEndian),
	        dv.getFloat32(offset+8, isLittleEndian)
	    );
	    offset += 12;

	    // Get all 3 vertices for this triangle
	    for (var j = 0; j < 3; j++) {
	        geo.vertices.push(
	            new THREE.Vector3(
	                dv.getFloat32(offset, isLittleEndian),
	                dv.getFloat32(offset+4, isLittleEndian),
	                dv.getFloat32(offset+8, isLittleEndian)
	            )
	        );
	        offset += 12
	    }

	    // there's also a Uint16 "attribute byte count" that we
	    // don't need, it should always be zero.
	    offset += 2;   

	    // Create a new face for from the vertices and the normal 
	    var newFace = new THREE.Face3(i*3, i*3+1, i*3+2, normal);            
	    geo.faces.push(newFace);
	}

	// The binary STL I'm testing with seems to have all
	// zeroes for the normals, unlike its ASCII counterpart.
	// We can use three.js to compute the normals for us, though,
	// once we've assembled our geometry. This is a relatively 
	// expensive operation, but only needs to be done once.
	geo.computeFaceNormals();

	mesh = new THREE.Mesh( 
	    geo,
	    // new THREE.MeshNormalMaterial({
	    //     overdraw:true
	    // }
	    new THREE.MeshLambertMaterial({
	        overdraw:true,
	        color: 0xa8a8a8,
	        shading: THREE.FlatShading
	    }
	));

	scene.add(mesh);

	stl = null;
	};  

	var minX = 1000000;
  	var minY = 1000000;
  	var minZ = 1000000;
  	var maxX = -1000000;
  	var maxY = -1000000;
  	var maxZ = -1000000;

        var supportedTrianglesByConfiguration;
        // this is harsh.  but we gotta do it
        d3.json("data/wizzardSupported.json", function(error, json) {
          if (error) return console.warn(error);
          supportedTrianglesByConfiguration = json;
          console.log(supportedTrianglesByConfiguration);
        });
  
	var parseStl = function(stl) {
	var state = '';
	var lines = stl.split('\n');
	var geo = new THREE.Geometry();
	var name, parts, line, normal, done, vertices = [];
	var vCount = 0;
	stl = null;

	for (var len = lines.length, i = 0; i < len; i++) {
	    if (done) {
	        break;
	    }
	    line = trim(lines[i]);
	    parts = line.split(' ');
	    switch (state) {
	        case '':
	            if (parts[0] !== 'solid') {
	                console.error(line);
	                console.error('Invalid state "' + parts[0] + '", should be "solid"');
	                return;
	            } else {
	                name = parts[1];
	                state = 'solid';
	            }
	            break;
	        case 'solid':
	            if (parts[0] !== 'facet' || parts[1] !== 'normal') {
	                console.error(line);
	                console.error('Invalid state "' + parts[0] + '", should be "facet normal"');
	                return;
	            } else {
	                normal = [
	                    parseFloat(parts[2]), 
	                    parseFloat(parts[3]), 
	                    parseFloat(parts[4])
	                ];
	                state = 'facet normal';
	            }
	            break;
	        case 'facet normal':
	            if (parts[0] !== 'outer' || parts[1] !== 'loop') {
	                console.error(line);
	                console.error('Invalid state "' + parts[0] + '", should be "outer loop"');
	                return;
	            } else {
	                state = 'vertex';
	            }
	            break;
	        case 'vertex': 
	            if (parts[0] === 'vertex') {
	            	// console.log("X:" + parseFloat(parts[1]) + " Y:" + parseFloat(parts[2]) + " Z:" + parseFloat(parts[3]));
	                if (parseFloat(parts[1]) < minX) {
	                	minX = parseFloat(parts[1]);
	                }
	                if (parseFloat(parts[1]) > maxX) {
	                	maxX = parseFloat(parts[1]);
	                }
	                if (parseFloat(parts[2]) < minY) {
	                	minY = parseFloat(parts[2]);
	                }
	                if (parseFloat(parts[2]) > maxY) {
	                	maxY = parseFloat(parts[2]);
	                }
	                if (parseFloat(parts[3]) < minZ) {
	                	minZ = parseFloat(parts[3]);
	                }
	                if (parseFloat(parts[3]) > maxZ) {
	                	maxZ = parseFloat(parts[3]);
	                }
	                geo.vertices.push(new THREE.Vector3(
	                    parseFloat(parts[1]),
	                    parseFloat(parts[2]),
	                    parseFloat(parts[3])
	                ));
	            } else if (parts[0] === 'endloop') {
	            	// console.log("ADDING FACE");
	            	var face = new THREE.Face3( vCount*3, vCount*3+1, vCount*3+2, new THREE.Vector3(normal[0], normal[1], normal[2]) );
	            	// Valkyrie
	            	face.color.setRGB( normal[0], normal[1], normal[2] );
                        console.log(normal);
	                geo.faces.push(face);

                        relevantTriangles = [];
                        /*supportedTrianglesByConfiguration.foreach(function(cfg) {
                          if(cfg.x == mesh.rotation.x && cfg.y == mesh.rotation.y && cfg.z == mesh.rotation.z) {
                            relevantTriangles = cfg.triangles;
                          }
                        });
                        var vertex1 = geo.vertices[vCount*3];
                        var vertex2 = geo.vertices[vCount*3];
                        var vertex3 = geo.vertices[vCount*3];
                        relevantTriangles.foreach(function(triangle) {
                        
                        });*/

	                vCount++;
	                state = 'endloop';
	            } else {
	                console.error(line);
	                console.error('Invalid state "' + parts[0] + '", should be "vertex" or "endloop"');
	                return;
	            }
	            break;
	        case 'endloop':
	            if (parts[0] !== 'endfacet') {
	                console.error(line);
	                console.error('Invalid state "' + parts[0] + '", should be "endfacet"');
	                return;
	            } else {
	                state = 'endfacet';
	            }
	            break;
	        case 'endfacet':
	            if (parts[0] === 'endsolid') {
	                //mesh = new THREE.Mesh( geo, new THREE.MeshNormalMaterial({overdraw:true}));
	                mesh = new THREE.Mesh( 
	                    geo, 
	                    new THREE.MeshBasicMaterial({
	                        // overdraw:true,
	                        color: 0xffffff,
	                        // shading: THREE.FlatShading,
	                        vertexColors: THREE.FaceColors
	                    }
	                ));
	                scene.add(mesh);
	                done = true;
	            } else if (parts[0] === 'facet' && parts[1] === 'normal') {
	                normal = [
	                    parseFloat(parts[2]), 
	                    parseFloat(parts[3]), 
	                    parseFloat(parts[4])
	                ];
	                if (vCount % 1000 === 0) {
	                    console.log(normal);
	                }
	                state = 'facet normal';
	            } else {
	                console.error(line);
	                console.error('Invalid state "' + parts[0] + '", should be "endsolid" or "facet normal"');
	                return;
	            }
	            break;
	        default:
	            console.error('Invalid state "' + state + '"');
	            break;
	    }
	}
	console.log("MinX: " + minX + " MaxX: " + maxX + " MinY: " + minY + " MaxY: " + maxY + " MinZ: " + minZ + " MaxZ: " + maxZ);
	// geo.position.set(0, 0, 0);
	};


	init();
	animate();

	function init() {

	//Detector.addGetWebGLMessage();

	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera( 45, this.width / this.height, 1, 1000 );
	// camera = new THREE.PerspectiveCamera(75, this.width /this.height, 10000); //view_angle, aspect = width/height, near, far
	camera.position.z = 200;
	camera.position.y = 0;
	camera.position.x = 0;
	scene.add( camera );

	var directionalLight = new THREE.DirectionalLight( 0xffffff );
	directionalLight.position.x = 0; 
	directionalLight.position.y = 0; 
	directionalLight.position.z = 1; 
	directionalLight.position.normalize();
	scene.add( directionalLight );

	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function () {
	    if ( xhr.readyState == 4 ) {
	        if ( xhr.status == 200 || xhr.status == 0 ) {
	            // var rep = xhr.response; // || xhr.mozResponseArrayBuffer;
	            // console.log(rep);
	            // parseStlBinary(rep);
	            parseStl(xhr.responseText);
	            mesh.rotation.x = 0;
	            mesh.rotation.z = 0;
	            console.log('done parsing');
	        }
	    }
	}
	xhr.onerror = function(e) {
	    console.log(e);
	}

	// xhr.open( "GET", 'stls/Octocat-v1.stl', true );
	xhr.open( "GET", stlFileName, true );
	// xhr.responseType = "arraybuffer";
	xhr.setRequestHeader("Accept","text/plain");
	xhr.setRequestHeader("Content-Type","text/plain");
	xhr.setRequestHeader('charset', 'x-user-defined');
	xhr.send( null );

	renderer = new THREE.WebGLRenderer(); //new THREE.CanvasRenderer();
	// renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setSize( window.innerWidth/2, window.innerHeight );

	document.getElementById("model").appendChild( renderer.domElement );

	// DERRICK Camera:
	// controls = new THREE.TrackballControls( camera, renderer.domElement );
	// controls = new THREE.OrbitControls( camera, renderer.domElement );


	// stats = new Stats();
	// stats.domElement.style.position = 'absolute';
	// stats.domElement.style.top = '0px';
	// document.body.appendChild(stats.domElement);
	}

	function animate() {

	// note: three.js includes requestAnimationFrame shim
	requestAnimationFrame( animate );
	render();
	// stats.update();
	// controls.update();


	}

	function render() {
		if (mesh) {
	    // console.log("3D Model Update")
	    // mesh.rotation.z += 0.02;
	    mesh.rotation.y = (yRotation/ 180) * 3.14;
	    mesh.rotation.x = (xRotation/ 180) * 3.14;
	    // mesh.translateZ = -0.5;
		renderer.render( scene, camera );
		}
	}
}
