/**
All classes and functions that pertain to the javascript for Model Viewing, loading and annotating
@module ModelView
**/

/**
The modelViewer class is the way to view your model files and add annotations to it.
</br> It instantiates a scene in a renderer, and adds a plane and lighting to it. It is controlled by a controls class, and multiple models can be added to it.
Usage:
<pre>
	var viewer = new modelViewer(scene_container_id, model_file_id, annotationUI_object);
	viewer.initalize(); //Once the rest of the code is done
	viewer.addModel(model_url, (3,4,5));
</pre>
@modul ModelView
@class ModelViewer
@constructor
@param {String} sceneContainer The id for the HTML element to which the render will be appended
@param {String} uniqueID The id for this particular model file version, used for posting annotations
@param {Object} annotationUI An HTML object of annotationUI class which deals with all the annotations highlighting and UI features
**/
modelViewer = function(sceneContainer, uniqueID, annotationUI) {

	//Scene variables
	//Scene is = {width (in px), height (in px), scene (the actual scene object)}
	var scene;
	var sceneID = uniqueID;
	var sceneElement = $(sceneContainer);
	
	//Essentials
	var camera; //Added to scene.scene
	var renderer; //The DOM element for the renderer
	var controller; //The controller (event handeler) linked up to renderer

	//Intersection variables. Objects of the Plane, Models and annot classes
	var plane;
	var models = [];
	var annot;

	//Camera tween. Stores the temporary camera positions as its moved from one position to another
	var tween;

	//Me
	var me = this;

	/* HELPER FUNCTIONS */
	//Helper function to debug
	function debug(str){
		if(true){
			console.log(str);
		}
	}

	//Helper function to convert 3-vectors to Strings
	function v3ToString(v){
			return v.x + ',' + v.y + ',' + v.z;
	}

	//Helper function to convert strings to 3-vectors
	function stringToV3(s){
		s = s.split(',');
		if (s.length != 3){
			error("string length wasn't 3 in stringToV3");
			return;
		} else{
			if (typeof s[0] == "string")
				return new THREE.Vector3(parseFloat(s[0]), parseFloat(s[1]), parseFloat(s[2]));
			else 
				return new THREE.Vector3(s[0], s[1], s[2]);
		}
	}

	/* PRIVATE FUNCTIONS */

	//The animate function performs the re-rendering and calls itself using requestAnimationFrame 
	function animate() {
		requestAnimationFrame(animate);
		controller.controls.update();
		TWEEN.update();
		renderer.render(scene.scene, camera);
	}

	//The moveCamera function moves the scene's camera to a specific position
	function moveCamera(newPosition) {

		var oldpos = {x: camera.position.x, y: camera.position.y, z: camera.position.z};

		tween = new TWEEN.Tween(oldpos).to(newPosition, 500);
		tween.onUpdate(function(){
			camera.position.x = oldpos.x; camera.position.y = oldpos.y; camera.position.z = oldpos.z;
		});
		tween.start();

		camera.lookAt(new THREE.Vector3(0,0,0));
		camera.updateMatrix();
	}

	//The initialization function creates the scene, adds event listeners and lights
	function init(){
		
		objects = [];
		//Set up scene
		scene = { "width": 845, "height": 480, "scene": new THREE.Scene()};	
		camera = new THREE.PerspectiveCamera(45, 1.77, scene.width /scene.height, 10000); //view_angle, aspect = width/height, near, far
		moveCamera(new THREE.Vector3(0,0,100));
		scene.scene.add(camera);

		//create and append renderer to sceneElement
		renderer = new THREE.WebGLRenderer();
		renderer.setSize(scene.width, scene.height);
		sceneElement.append(renderer.domElement);
		debug("Added renderer to dom");

		//Set up the controls: This is boring stuff
		var controls = new THREE.TrackballControls(camera, renderer.domElement);
		controls.target.set( 0, 0, 0 ); controls.rotateSpeed = .5;	controls.zoomSpeed = .5; controls.panSpeed = 0.8;
		controls.noZoom = false; controls.noPan = false;  controls.staticMoving = false; controls.dynamicDampingFactor = 0.15;
		controls.keys = [65,83,68];
		controller = {"controls": controls, "projector": new THREE.Projector()};

		//Event listeners: Handling things!
		renderer.domElement.addEventListener('mousedown', function(){ moveFlag = 0;}, false);
		renderer.domElement.addEventListener('mouseup', viewMouseUp, false);
		renderer.domElement.addEventListener('mousemove', viewMouseOver, false);

		//Add lighting!
		var pointLight1 = new THREE.PointLight(0xFFFFFF);
		pointLight1.position = new THREE.Vector3(40,50,130);
		scene.scene.add(pointLight1);
		var pointLight2 = new THREE.PointLight(0xFFFFFF);
		pointLight2.position = new THREE.Vector3(-40,-50,-130);
		scene.scene.add(pointLight2);
		debug("Added lighting to scene");

		//Add plane! 
		plane = new Plane();

		//Have a variable around for annotation functions
		annot = new Annotations();
		
		animate();
		
	}

	//The intersector function takes a mouse click, and returns a "Ray" to the scene for that mouse click
	function intersector(event){
	 	var vector = new THREE.Vector3(
	        ( event.offsetX / scene.width ) * 2 - 1,
	      - ( event.offsetY / scene.height ) * 2 + 1,
	       	.5
	    );
	   	controller.projector.unprojectVector( vector, camera );
	    var ray = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
	   	ray.precision = 0.001;
	    return ray;
	}

	//To stop on clicks on drags
	function viewMouseOver(event){
		moveFlag = 1;
	}

	//Click functions
	function viewMouseUp(event){

		//Only if we're not current dragging
		if(moveFlag === 0){
			event.preventDefault();

			//Get a ray for this event
			var ray = intersector(event);

			//If the ray intersects an annotation, highlight the right annotation in the viewer and in the UI
			var intersect_response = annot.intersects(ray);
			if (intersect_response) {
				me.highlightAnnotation(intersect_response);
				annotationUI.highlightAnnotation(intersect_response);
				return;
			} 

			//If the ray intersects any object, add an anontation to that object at a point and post it to server
			for (var i=0; i< models.length; i++){
				var model = models[i];
				intersect_response = model.intersects(ray);
				if (intersect_response) {
					//Add a new annotation on the point
					postAnnotation(intersect_response);
					return;
				} 
			}
			
			//If the ray intersects the plane, add an annotation to plane at a point and post it to server
			intersect_response = plane.intersects(ray);
			if (intersect_response) {
				//Add a new annotation on the point
				postAnnotation(intersect_response);
				return;
			} 
		}
	}	


	/**
	Initialize the viewer once it has been constructed. Not done automatically, must be done.

	@method initialize
	**/
	this.initialize = function() {
		init(); //Auto call to init viewer
	}


	/**
	(Private) Inner class of ModelViewer for the Plane of a scene. On Instantiation it adds the plane to the scene.
	@class ModelViewer.Plane
	@for ModelViewer
	@constructor
	**/
	Plane = function(){
		
		var plane;

		function createPlane(){
			var planeMat = new THREE.MeshBasicMaterial({color: 0xFFAF96, wireframe:true, transparent: true});
			planeMat.opacity = 0.3;
			plane = new THREE.Mesh( new THREE.PlaneGeometry(100, 100, 10,10), planeMat);
			scene.scene.add(plane);
		}

		/**
		@method intersects
		@for ModelViewer.Plane
		@param ray A vector for the ray to intersect with
		@return {Object} Returns either false if no intersection, or the point of intersection if it intersects

		**/
		this.intersects = function(ray){
			var intersect = ray.intersectObjects([plane]);
			if(intersect.length >0){
				debug("Intersected plane");
				return intersect[0].point;
			} else {
				return false;
			}
		}

		createPlane();
	}

	/**
	(Private) Inner class of ModelViewer for a model in the scene. Uses the STLLoader class to get the class.
	
	@class ModelViewer.Model
	@for ModelViewer
	@constructor
	@param {String} fileName The file url to load the model from
	**/
	Model = function(fileName){

		var file = fileName;

		//A loader element to which we can write the loading status
		var loaderStatus_element = $("#loader_status"); 
		var objectColor = "#C0D8F0";
		var object;
		var visible = true;

		/**
		The load function uses the STLLoader to load the model file, then adds it to the scene at a specified position.

		@method load
		@for ModelViewer.Model
		@param {THREE.Vector} object_position Position to add the loaded file
		**/
		this.load = function(object_position) {
			
			var loader = new THREE.STLLoader();
			$(loaderStatus_element).html("Loading element");
			
			loader.addEventListener( 'load', function ( event ) {
				
				var geometry = event.content;
				$(loaderStatus_element).html("s to zoom, d to pan");

				//Create material and mesh
				var material = new THREE.MeshLambertMaterial({color:objectColor, shading: THREE.FlatShading});
				var mesh = new THREE.Mesh( geometry, material );				
				var boundedBy = mesh.geometry.boundingSphere.radius;
				var scaleFactor = 25/boundedBy;			

				//Move the mesh around
				mesh.position.set(object_position[0], object_position[1], object_position[2]); //TODO: Calculate position and rotation better
				mesh.rotation.set( 0, - Math.PI / 2, 0 );
				mesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
				
				object = mesh; //TODO: Do we need this anymore? For plane and stuff
				console.log("ADDING MESH! to" + object_position);
				scene.scene.add(mesh);

			});

			loader.load(file);

		} 

		/**
		@method setColor
		@for ModelViewer.Model
		@param {Color} color The color we want to change the objects color too
		**/
		this.setColor = function(color) {
			objectColor = color;
		}

		/**
		@method intersects
		@for ModelViewer.Model
		@param ray A vector for the ray to intersect with
		@return {Object} Returns either false if no intersection, or the point of intersection if it intersects
		**/
		this.intersects = function(ray){
			var intersect = ray.intersectObjects([object]);
			if(intersect.length >0){
				debug("Intersects model");
				return intersect[0].point;
			} else {
				return false;
			}
		}

		/**
		Turn of whether or not this model is viewed in the scene
		@for ModelViewer.Model
		@method toggleModelView
		**/
		this.toggleModelView = function() {
			if (visible) {
				scene.scene.remove(object);
				visible = !visible;	
			} else {
				scene.scene.add(object);
				visible = !visible;
			}
			
		}
	}


	/**
	Toggle a specific model on and off
	@method toggleModel
	@for ModelViewer
	@param {int} i The model number (chronologically) to hide or show
	**/
	this.toggleModel = function(i) {
		var model = models[i];
		model.toggleModelView();
		animate();
	}

	/**
	The addModel method is used to add a particular model to the scene. Instantiates a new model which is added to the models array.

	@method addModel
	@param {String} fileName The url for the file that we're going to load
	@param {Vector} position The 3D vector for position. Optional, set to (0,0,0) if not defined
	**/
	this.addModel = function(fileName, position){
		position = typeof position !== 'undefined' ? position : [0,0,0]

		var model = new Model(fileName);
		model.load(position);
		models.push(model);

	}

	/**
	(Private) Inner class of ModelViewer that is in charge of all the spheres that act as annotations
	@class ModelViewer.Annotations
	@for ModelViewer
	@constructor
	**/
	Annotations = function() {
		

		var annotations = {}  //annotations[id] = [data in json,  actual object]
		var obj_to_id = [[],[]]; //two arrays, one for id one for object
		var annotColor =  "#3079ed";
		var viewAnnots = true;


		/* HELPER FUNCTIONS */

		//Create a mapping between an object and its id (for click events)
		function createMap(id, object) {
			obj_to_id[0].unshift(object);
			obj_to_id[1].unshift(id);
		}

		//Get an ID based on the actual 3d object that was clicked
		function getIdWithObj(object){
			return obj_to_id[1][obj_to_id[0].indexOf(object)]; 
		}

		/**
		This function adds annotations to the list of annotations and the scene. </br>
		It is called by the modelViewers registerAnnotation function which is usually called by the server once an annotation has sucesfully been created.

		@method newAnnotation
		@for ModelViewer.Annotations
		@param {String} id The unique id for this annotation
		@param {THREE.Vector} camera The camera position when this annotation was recorded
		@param {THREE.Vector} point The point at which this annotation is to be added 
		**/
		//The register annotation function takes an id and position data (camera,point) and adds an actual annotation object to the viewer for it
		this.newAnnotation = function(id, camera, point) {
			annotations[id] =  [];
			annotations[id][0] = {"camera": camera, "point": point}; //Register the data for the annotation

			var sphereMaterial = new THREE.MeshBasicMaterial({ color: annotColor, transparent: true});
			sphereMaterial.opacity = 0.6;
			var sphere = new THREE.Mesh(
			  new THREE.SphereGeometry(
			    3, //radius
			    100, //segments
			    100), //rings
			  sphereMaterial);
			createMap(id, sphere);
			sphere.position = point;
			if (viewAnnots){ //TODO : could be less jank
				scene.scene.add(sphere);
			}

			annotations[id][1] = sphere;  //Register the actual object for the annotation
			createMap(id,sphere);
		}
		
		/**
		This function is used to highlight an annotation by moving the camera to look at it.

		@method viewAnnotation
		@for ModelViewer.Annotations
		@param {String} id The id of the annotation that we'd like to view
		**/
		this.viewAnnotation = function(id) {
			moveCamera(annotations[id][0].camera);
		}

		/**
		@method intersects
		@for ModelViewer.Annotations
		@param ray A vector for the ray to intersect with
		@return {Object} Returns either false if no intersection, or the point of intersection if it intersects
		**/		
		this.intersects = function(ray){
			var spheres =  obj_to_id[0];
			var intersect = ray.intersectObjects(spheres);
			if (intersect.length > 0){
				debug("Intersects annotation");
				return getIdWithObj(intersect[0].object);
			} else {
				return false;
			}
		}
		
		/**
		Turn of whether or not all the annotations are viewable
		@method toggleAnnotationView
		@for ModelViewer.Annotations
		**/
		this.toggleAnnotationView = function(){
			viewAnnots = !viewAnnots;
			for (var i = 0; i < obj_to_id[0].length; i++){
				var obj = obj_to_id[0][i];
				if (viewAnnots)	{scene.scene.add(obj);}
				else  { scene.scene.remove(obj); }
			}
		}
	}

	//We have the point, now we ask for an input from the main UI methods. Callback is receiveannotation in this class
	//TODO: THIS IS MESSY BECAUSE IT REFERS TO A WINDOW VARIABLE
	function postAnnotation(point){
		var name;
		name = getInput(Window.objectViewer.receiveAnnotation, point);
	}

	/**
	The receive annotation function deals with callbacks from when a new annotation's name is asked. 
	It posts a new annotation to the server with the camera's current position, name and the point.
	The server on post success will callback the registerAnnotation function which will add it to the scene

	@method receiveAnnotation
	@for ModelViewer
	@param {String} name The name of the annotation we're trying to create
	@param {String} point The string encoding of a 3D Vector (x,y,z) at which the annotation should be created
	**/
	this.receiveAnnotation = function(name, point) {
		
		if (name === null || name === "" || typeof name === "undefined" || typeof point == undefined || point === null){
			displayError("Cannot create empty annotation");
		} else {
			debug("POST ANNOTATION AT " + point);
			$.post('/versions/' + sceneID + '/annotations', {"camera": v3ToString(camera.position.clone()), "coordinates": v3ToString(point) , "text": name}, function(data){
				//Overwritten by annotations/create.js.erb
			}).error(AJAXerrorHandler);
		}
	}

	/**
	This function takes an id, and then tells the annotations object to look at a specific annotation

	@method highlightAnnotation
	@param {String} id The unique id for the annotation we want to view
	**/
	this.highlightAnnotation = function(id) {
		annot.viewAnnotation(id);
	}

	
	/**
	The method which adds the annotation to the scene. It is usually called on annotation#create success callback 

	@method registerAnnotation
	@param {String} id The unique id for the annotation we want to add
	@param {JSON} data {camera, coordinates} at which the annotation is added
	**/
	this.registerAnnotation = function(id, data){
		//TODO: ADD ERROR CHECKING FOR THIS!
		annot.newAnnotation(id, stringToV3(data.camera), stringToV3(data.coordinates));
	}

	/**
	Toggle annotations on and off
	@method toggleAnnotation
	**/
	this.toggleAnnotations = function() {
		annot.toggleAnnotationView();
		animate();
	}


}
