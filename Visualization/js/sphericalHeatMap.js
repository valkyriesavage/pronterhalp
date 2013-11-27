/**
Spherical Heat Map
*/
function SphericalHeatMap(width, height) {
  this.width = width;
  this.height = height;
  this.targetList = [];
  this.projector = { x: 0, y: 0 };
  console.log("Spherical Heat Map Init");
}

SphericalHeatMap.prototype.initTrackball = function(camera, rotate, zoom, pan, damping) {
    controls.rotateSpeed = rotate || 1.0;
    controls.zoomSpeed = zoom || 1.2;
    controls.panSpeed = pan || 0.8;
    controls.noZoom = true;
    controls.noPan = true;
    controls.staticMoving = false;
    controls.dynamicDampingFactor = damping || 0.3;
    return controls;
}

SphericalHeatMap.prototype.addToBody = function() { 
	// SCENE
    scene = new THREE.Scene();
    // CAMERA
    var SCREEN_WIDTH = this.width, SCREEN_HEIGHT = this.height;
    var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
    camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
    scene.add(camera);
    camera.position.set(0,0,250);
    // camera.lookAt(scene.position); 

    // RENDERER
    var container = document.createElement( 'div' );
    document.body.appendChild( container );
    if ( Detector.webgl )
        renderer = new THREE.WebGLRenderer( {antialias:true} );
    else
        renderer = new THREE.CanvasRenderer(); 
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    container.appendChild(renderer.domElement);

    // CONTROLS
    controls = new THREE.TrackballControls( camera, renderer.domElement );
    this.initTrackball(camera, null, null, null, null);
    // controls = new THREE.OrbitControls( camera, renderer.domElement );

    // LIGHT
    var light = new THREE.PointLight(0xffffff);
    light.position.set(0,250,0);
    scene.add(light);

    // this material causes a mesh to use colors assigned to faces
    var faceColorMaterial = new THREE.MeshBasicMaterial( 
    { color: 0xffffff, vertexColors: THREE.FaceColors } );
    
    var sphereGeometry = new THREE.SphereGeometry( 90, 10, 10);
    for ( var i = 0; i < sphereGeometry.faces.length; i++ ) 
    {
            UV = sphereGeometry.faceVertexUvs[0];
            face = sphereGeometry.faces[ i ];  
            console.log("<" + face.normal.x + " " + face.normal.y + " " + face.normal.z+ ">");
            // face.color.setRGB( 0, 0, 0.8 * Math.random() + 0.2 );    
            face.color.setRGB( 0 , 0 , i/ sphereGeometry.faces.length );                
    }
    var sphere = new THREE.Mesh( sphereGeometry, faceColorMaterial );
    sphere.position.set(0, 0, 0);
    scene.add(sphere);
    
    this.targetList.push(sphere);
        
    // initialize object to perform world/screen calculations
    this.projector = new THREE.Projector();

    function update()
	{
            if (sphere) {
                console.log("Sphere Update")
                sphere.rotation.z += 0.02;
                sphere.rotation.y += 0.02;
                sphere.rotation.x += 0.02;
            } 
	        controls.update();
	}

	function render() 
	{
	        renderer.render( scene, camera );
	}

	function animate() 
	{
	    requestAnimationFrame( animate );
	    render();                
	    update();
	}

    // animate it
    animate();

    return sphere;
}
