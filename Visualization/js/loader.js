
/** 
The STLLoader class can be given a url and used to parse the file.
Originally by http://adamleeper.com/ & http://mrdoob.com/ edited for Fabbit
</br> 
The file can be an ASCII STL file or a Binary STL file. The file can be a raw string dump or in binary format.

Usage:
<pre>
 var loader = new THREE.STLLoader();
 loader.addEventListener( 'load', function ( event ) {}
   var geometry = event.content;
   scene.add( new THREE.Mesh( geometry ) );
 });
 loader.load( './models/stl/slotted_disk.stl' );
</pre>

@class STLLoader
@constructor
**/
THREE.STLLoader = function () {

  THREE.EventDispatcher.call( this );

};


THREE.STLLoader.prototype = {

  constructor: THREE.STLLoader,

  /** 
  Load function called by loader.log(fileName);
   
  @method load
  @param {String} url URL to get the fileName
  @return {Null} null No return value, issues a load event when completed
  **/
  load: function (url) {

    var scope = this;

    //We perform a get Request to get the URL from wherever it is stored!
    var request = new XMLHttpRequest();

    //This event listeneris called once the request is finished loading
    request.addEventListener( 'load', function ( event ) {

      //Once we get the contents of the file, we parse it. Then we dispatch a load event to the caller
      var geometry;
      geometry = scope.parse( event.target.response);
      scope.dispatchEvent( { type: 'load', content: geometry } );

    }, false );

    request.addEventListener( 'progress', function ( event ) {
      scope.dispatchEvent( { type: 'progress', loaded: event.loaded, total: event.total } );
    }, false );

    request.addEventListener( 'error', function () {
      scope.dispatchEvent( { type: 'error', message: 'Couldn\'t load URL [' + url + ']' } );
    }, false );

    //Send the request with custom paramaters for fabbit (x-user-defined)
    request.open( 'GET', url, true );
    request.overrideMimeType('text/plain; charset=x-user-defined');
    request.send( null );
  },

  /**
  The parse function does most of the grunt work for the loader, using other functions to figure out the type of file to be parsed

  @method parse
  @return {String} contents returns the string form of the contents
  **/
  parse: function (buf) {

    var find_type = this.isASCII(buf);
    if(find_type[0]) //IE: it is a string file
    {
      if (find_type[1]) { 
        //It is a binary string file so we convert to ascii
        var str = this.bin2str(buf);
       } else {
        //It is an ascii string file so ready to be parsed
          str = buf;
      }
      return this.parseASCII(str);
    } else {
      return this.parseBinaryFile(buf);
    }
  },

  /**
  Returns the string contents for a given file buffer

  @method bin2str
  @param {Buffer} buf
  @return {String} str
  **/
  bin2str: function (buf) {

    var array_buffer = new Uint8Array(buf);
    var str = '';
    for(var i = 0; i < buf.byteLength; i++) {
      str += String.fromCharCode(array_buffer[i]); // implicitly assumes little-endian
    }
    return str
  },

  /** 
  Given the contents of a file (buf), we see if the file is an ASCII stl file or a BINARY stl file AND whether its in binary form or string form
  ASCII stl files start with the word "solid" and then have a plaintext description of their contents including some "vertex"'s'
  Binary stl files should not start with "solid", but sometimes they do. They definitely should not have any "vertex" descriptions
  
  @method isASCII
  @param {String} File Buffer for file or String contents of file
  @return {Array} Returns [is_ascii_stl, is_string_file] returns whether or not the file is an ASCII stl file or a BIN stl file in string or buffer form
  **/
  isASCII: function(buf){
    
    var is_ascii_stl;
    var is_buffer_file;

    //If the buffer comes in as a simple string (Get request from server usually returns this);
    if (typeof(buf) === 'string'){
      
      is_buffer_file = false;
      var str = buf.substring(0,5);

      //Check for solid string existance and then for vertex descriptions,
      if (str.indexOf("solid") >= 0) {
        if (buf.indexOf("vertex") >= 0){
          is_ascii_stl = true; 
        } else {
          is_ascii_stl = false;
        }
      } else {
        is_ascii_stl = false; 
      }

    } else { 

      //Comes in as a DataView so it is not a string
      is_buffer_file =true;
      var dv = new DataView(buf);
      var str = '';
      for(var i = 0; i < 10; i++) {
        str += String.fromCharCode(dv.getUint8(i, true)); // assume little-endian
      }
      is_ascii_stl = str.indexOf("solid") >= 0;
    }

    return [is_ascii_stl, is_buffer_file];
  },

  //Helper function to parse ascii stl files in string format, unedited from original
  parseASCII: function ( data ) {

    var geometry = new THREE.Geometry();

    var patternFace = /facet([\s\S]*?)endfacet/g;
    var result;

    while ( ( result = patternFace.exec( data ) ) != null ) {
      var text = result[ 0 ];

      // Normal
      var patternNormal = /normal[\s]+([-+]?[0-9]+\.?[0-9]*([eE][-+]?[0-9]+)?)+[\s]+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)+[\s]+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)+/g;

      while ( ( result = patternNormal.exec( text ) ) != null ) {

        var normal = new THREE.Vector3( parseFloat( result[ 1 ] ), parseFloat( result[ 3 ] ), parseFloat( result[ 5 ] ) );

      }

      // Vertex
      var patternVertex = /vertex[\s]+([-+]?[0-9]+\.?[0-9]*([eE][-+]?[0-9]+)?)+[\s]+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)+[\s]+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)+/g;

      while ( ( result = patternVertex.exec( text ) ) != null ) {

        geometry.vertices.push( new THREE.Vector3( parseFloat( result[ 1 ] ), parseFloat( result[ 3 ] ), parseFloat( result[ 5 ] ) ) );

      }

      var len = geometry.vertices.length;
      geometry.faces.push( new THREE.Face3( len - 3, len - 2, len - 1, normal ) );

    }

    geometry.computeCentroids();
    geometry.computeBoundingSphere();
    return geometry;
  },

  //Helper function to parse binary stl files in binary format, unedited from original
  parseBinaryFile: function(input) {
 
    input = new BinaryReader(input);

    // Skip the header.
    input.seek(80);

    var geometry = new THREE.Geometry();
    // Load the number of vertices.
    var count = input.readUInt32();

    // During the parse loop we maintain the following data structures:
    var vertices = [];   // Append-only list of all unique vertices.
    var vert_hash = {};  // Mapping from vertex to index in 'vertices', above.
    var faces    = [];   // List of triangle descriptions, each a three-element
                         // list of indices in 'vertices', above.


    for (var i = 0; i < count; i++) {
      if (i % 100 == 0) {
        //console.log('Parsing ' + (i+1) + ' of ' + count + ' polygons...');
      }
      
      // Skip the normal (3 single-precision floats)
      input.seek(input.getPosition() + 12);

      var face_indices = [];
      for (var x = 0; x < 3; x++) {
        var vertex = [input.readFloat(), input.readFloat(), input.readFloat()];
       
        var vertexIndex = vert_hash[vertex];
        if (vertexIndex == null) {
          vertexIndex = vertices.length;
          vertices.push(vertex);
          vert_hash[vertex] = vertexIndex;
        }

        face_indices.push(vertexIndex);
      }
      faces.push(face_indices);

      // Skip the "attribute" field (unused in common models)
      input.readUInt16();
    }

    for (var i=0; i<faces.length; i++){
      geometry.faces.push(new THREE.Face3(faces[i][0], faces[i][1], faces[i][2]));
    }
    for (var i=0; i<vertices.length; i++){
      geometry.vertices.push(new THREE.Vector3(vertices[i][0], vertices[i][1], vertices[i][2]));
    }


    geometry.computeBoundingSphere();
    geometry.computeCentroids();
    geometry.computeFaceNormals();

    return geometry;
  },

  //Helper function to parse binary stl files in ascii format, unedited from original
  parseBinary: function (buf) {

    // STL binary format specification, as per http://en.wikipedia.org/wiki/STL_(file_format)
    //
    // UINT8[80] – Header
    // UINT32 – Number of triangles
    //
    // foreach triangle
    //   REAL32[3] – Normal vector
    //   REAL32[3] – Vertex 1
    //   REAL32[3] – Vertex 2
    //   REAL32[3] – Vertex 3
    //   UINT16 – Attribute byte count
    // end
    //

    function str2ab(str) {
      var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
      var bufView = new Uint16Array(buf);
      for (var i=0, strLen=str.length; i<strLen; i++) {
        bufView[i] = str.charCodeAt(i);
      }
      return buf;
    }


    var geometry = new THREE.Geometry();

    var headerLength = 80;
    var dataOffset = 84;
    var faceLength = 12*4 + 2;

    var le = true; // is little-endian  // This might be processor dependent...

    // var header = new Uint8Array(buf, 0, headerLength); // not presently used
    if (typeof(buf) === 'string') {
      buf = str2ab(buf);
    }

    var dvTriangleCount = new DataView(buf, headerLength, 4);

    var numTriangles = dvTriangleCount.getUint32(0, le);

    for (var i = 0; i < numTriangles; i++) {

      //console.log(dataOffset + i*faceLength, faceLength);
      
      //console.log(dataOffset + i*faceLength + " " + faceLength);
      var dv = new DataView(buf, dataOffset + i*faceLength, faceLength);

      var normal = new THREE.Vector3( dv.getFloat32(0, le), dv.getFloat32(4, le), dv.getFloat32(8, le) );

      for(var v = 3; v < 12; v+=3) {
        var v = new THREE.Vector3( dv.getFloat32(v*4, le), dv.getFloat32((v+1)*4, le), dv.getFloat32( (v+2)*4, le ) );
        //console.log(v);
        geometry.vertices.push(v);

      }
      var len = geometry.vertices.length;
      geometry.faces.push( new THREE.Face3( len - 3, len - 2, len - 1, normal ) );
    }

    geometry.computeCentroids();
    geometry.computeBoundingSphere();

    return geometry;
  }

};
