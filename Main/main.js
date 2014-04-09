
var canvas;
var gl;

var points = [];
var vertices = [];
//var colors = [];

var i = 0;

//var NumTimesToSubdivide = 5;

var objectCode = "# Blender v2.70 (sub 0) OBJ File: 'untitled.blend'\n# www.blender.org\nmtllib untitled.mtl\no Cube\nv 1.000000 -1.000000 -1.000000\nv 1.000000 -1.000000 1.000000\nv -1.000000 -1.000000 1.000000\nv -1.000000 -1.000000 -1.000000\nv 1.000000 1.000000 -0.999999\nv 0.999999 1.000000 1.000001\nv -1.000000 1.000000 1.000000\nv -1.000000 1.000000 -1.000000\nvn 0.471395 0.003497 -0.881915\nvn 0.128903 -0.961886 -0.241163\nvn 0.128902 -0.961883 -0.241175\nvn 0.147546 -0.949764 -0.276003\nusemtl Material\ns off\nf 1//32 2//32 3//32\nf 5//32 8//32 7//32\nf 1//32 5//32 6//32\nf 2//32 6//32 7//32\nf 3//32 7//32 8//32\nf 5//32 1//32 4//32\n";

//f 2058//3948 2211//3948 2212//3948

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    //
    //  Initialize our data
    //
    
    readVertices();
    readFaces();
    

    
    
    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    // enable hidden-surface removal
    
    //gl.enable(gl.DEPTH_TEST);
    
    //  Load shaders and initialize attribute buffers
    
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // Create a buffer object, initialize it, and associate it with the
    //  associated attribute variable in our vertex shader
    
    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    render();
};






function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT );// | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays( gl.TRIANGLES, 0, points.length );
}







function readVertices() {
    /* Read the vertices */
    var vertexList = new Array();

    // Skip the four first lines
    for (var bla = 0; bla < 4; bla++) {
        while (objectCode.charAt(i) != '\n') {
            i++;
        }
        i++;
    }



    // Read each vertex
    while (objectCode.charAt(i) == 'v' && objectCode.charAt(i+1) != 'n') {
        i += 2;
        var j;
        for (j = i; objectCode.charAt(j) != ' '; j++);
        var number1 = parseFloat(objectCode.substr(i, j-1)) / 2;

        i = j + 1;
        for (j = i; objectCode.charAt(j) != ' '; j++);
        var number2 = parseFloat(objectCode.substr(i, j-1)) / 2;

        i = j + 1;
        for (j = i; objectCode.charAt(j) != '\n'; j++);
        var number3 = parseFloat(objectCode.substr(i, j-1)) / 2;

        i = j + 1;

//        console.log(number1.toString());
//        console.log(number2.toString());
//        console.log(number3.toString());

        vertices.push( vec3( number1, number2, number3 ) );
    }
    
//    for (var k = 0; k < 8; k++) {
//        console.log(vertices[k].toString());
//    }
}









function readFaces() {
    // Skip all the 'vn' lines
    while (objectCode.charAt(i) == 'v') {
        while (objectCode.charAt(i) != '\n') {
            i++;
        }
        i++;
    }
    
    // Skip 2 more lines
    while (objectCode.charAt(i) != '\n') {
        i++;
    }
    i++;
    while (objectCode.charAt(i) != '\n') {
        i++;
    }
    i++;
    
    // Read each face
    while (objectCode.charAt(i) == 'f') {
        i += 2;
        var j;

        var number = [];

        for (j = i; objectCode.charAt(j) != '/'; j++);
        number[0] = parseInt(objectCode.substr(i, j-1)) - 1;
        for (i = j; objectCode.charAt(i) != ' '; i++);
        i++;
        
        for (j = i; objectCode.charAt(j) != '/'; j++);
        number[1] = parseInt(objectCode.substr(i, j-1)) - 1;
        for (i = j; objectCode.charAt(i) != ' '; i++);
        i++;
        
        for (j = i; objectCode.charAt(j) != '/'; j++);
        number[2] = parseInt(objectCode.substr(i, j-1)) - 1;
        for (i = j; objectCode.charAt(i) != '\n'; i++);
        i++;


//        console.log((number[0]+1).toString());
//        console.log((number[1]+1).toString());
//        console.log((number[2]+1).toString());
//        console.log((number[3]+1).toString());


        points.push(vertices[number[0]]);
        points.push(vertices[number[1]]);
        points.push(vertices[number[2]]);
        
//        console.log(vertices[number[0]].toString());
//        console.log(vertices[number[1]].toString());
//        console.log(vertices[number[2]].toString());
//        console.log(vertices[number[0]].toString());
//        console.log(vertices[number[2]].toString());
//        console.log(vertices[number[3]].toString());
    }

}
















//
//var canvas;
//var gl;
//
//var theta = 0.0;
//var thetaLoc;
//
//var cubeVertices = [];
//var varray;
//
//window.onload = function init()
//{
//    /* 
//        Load WebGL
//     */
//    canvas = document.getElementById( "gl-canvas" );
//    
//    gl = WebGLUtils.setupWebGL( canvas );
//    if ( !gl ) { alert( "WebGL isn't available" ); }
//
//    //  Configure WebGL
//    gl.viewport( 0, 0, canvas.width, canvas.height );
//    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
//
//    gl.enable(gl.DEPTH_TEST);
//    
//    //  Load shaders and initialize attribute buffers
//    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
//    gl.useProgram( program );
//    
//    
//    
//    
//    
//    var objectCode = "mtllib untitled.mtl\no Cube\nv 1.000000 -1.000000 -1.000000\nv 1.000000 -1.000000 1.000000\nv -1.000000 -1.000000 1.000000\nv -1.000000 -1.000000 -1.000000\nv 1.000000 1.000000 -0.999999\nv 0.999999 1.000000 1.000001\nv -1.000000 1.000000 1.000000\nv -1.000000 1.000000 -1.000000\nusemtl Material\ns off\nf 1 2 3 4\nf 5 8 7 6\nf 1 5 6 2\nf 2 6 7 3\nf 3 7 8 4\nf 5 1 4 8\n";
//    
//    
//    /* Read the vertices */w
//    var vertexList = new Array();
//    var k = 0;
//    var i = 0;
//    
//    // Skip the two first lines
//    while (objectCode.charAt(i) != '\n') {
//        i++;
//    }
//    i++;
//    while (objectCode.charAt(i) != '\n') {
//        i++;
//    }
//    i++;
//
//
//    
//    // Read each vertex
//    while (objectCode.charAt(i) == 'v') {
//        i += 2;
//        var j;
//        for (j = i; objectCode.charAt(j) != ' '; j++);
//        var number1 = parseFloat(objectCode.substr(i, j-1));
//
//        i = j + 1;
//        for (j = i; objectCode.charAt(j) != ' '; j++);
//        var number2 = parseFloat(objectCode.substr(i, j-1));
//        
//        i = j + 1;
//        for (j = i; objectCode.charAt(j) != '\n'; j++);
//        var number3 = parseFloat(objectCode.substr(i, j-1));
//        
//        i = j + 1;
//        
////        console.log(number1.toString());
////        console.log(number2.toString());
////        console.log(number3.toString());
//        
//        vertexList[k] = number1;
//        k++;
//        vertexList[k] = number2;
//        k++;
//        vertexList[k] = number3;
//        k++;
//    }
//    
//    
//    
//    
//    
//    
//    /* Read the faces */
//    
//    // Skip 2 more lines
//    while (objectCode.charAt(i) != '\n') {
//        i++;
//    }
//    i++;
//    while (objectCode.charAt(i) != '\n') {
//        i++;
//    }
//    i++;
//    
//    // Read each face
//    while (objectCode.charAt(i) == 'f') {
//        i += 2;
//        var j;
//        
//        var number = new Array();
//        
//        for (j = i; objectCode.charAt(j) != ' '; j++);
//        number[0] = parseInt(objectCode.substr(i, j-1)) - 1;
//        
//        i = j + 1;
//        for (j = i; objectCode.charAt(j) != ' '; j++);
//        number[1] = parseInt(objectCode.substr(i, j-1)) - 1;
//        
//        i = j + 1;
//        for (j = i; objectCode.charAt(j) != ' '; j++);
//        number[2] = parseInt(objectCode.substr(i, j-1)) - 1;
//        
//        i = j + 1;
//        for (j = i; objectCode.charAt(j) != '\n'; j++);
//        number[3] = parseInt(objectCode.substr(i, j-1)) - 1;
//        
//        i = j + 1;
//        
//        
////        console.log((number[0]+1).toString());
////        console.log((number[1]+1).toString());
////        console.log((number[2]+1).toString());
////        console.log((number[3]+1).toString());
//        
//        
//        for (var l = 0; l < 3; l++)
//            for (var h = 0; h < 3; h++) {
//                cubeVertices.push(vertexList[3*number[l] + h] / 2.0);
//            }
//        
//        for (var h = 0; h < 3; h++) {
//            cubeVertices.push(vertexList[3*number[0] + h] / 2.0);
//        }
//        for (var h = 0; h < 3; h++) {
//            cubeVertices.push(vertexList[3*number[2] + h] / 2.0);
//        }
//        for (var h = 0; h < 3; h++) {
//            cubeVertices.push(vertexList[3*number[3] + h] / 2.0);
//        }
//    }
//    
//    
////    for (k = 0; k < cubeVertices.length; k += 3) {
////        console.log(cubeVertices[k], cubeVertices[k+1], cubeVertices[k+2]);
////    }
//    
//    
//    
//    
//    
//    
////    var vertices = [
////        vec2(  0,  1 ),
////        vec2(  1,  0 ),
////        vec2( -1,  0 ),
////        vec2(  0, -1 )
////    ];
//    
//    varray = new Float32Array(cubeVertices);
//    
//    for (k = 0; k < cubeVertices.length; k += 3) {
//        console.log(varray[k], varray[k+1], varray[k+2]);
//    }
//    
//
//    
//    // Load the data into the GPU
//    var bufferId = gl.createBuffer();
//    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
//    gl.bufferData( gl.ARRAY_BUFFER, varray, gl.STATIC_DRAW );
//
//    // Associate out shader variables with our data buffer
//    var vPosition = gl.getAttribLocation( program, "vPosition" );
//    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
//    gl.enableVertexAttribArray( vPosition );
//    
//    
//    
//    thetaLoc = gl.getUniformLocation( program, "theta" );
//
//    render();
//};
//
//
//function render() {
//    
//    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
//
////    theta += 0.1;
////    gl.uniform1f( thetaLoc, theta );
//
//    console.log("Length: ", varray.length);
//    
//    gl.drawArrays( gl.TRIANGLES, 0, varray.length );   varray.length
//
////    window.requestAnimFrame(render);
//}
//
//
//
