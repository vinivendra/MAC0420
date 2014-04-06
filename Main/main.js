
var canvas;
var gl;

var theta = 0.0;
var thetaLoc;

window.onload = function init()
{
    /* 
        Load WebGL
     */
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //  Configure WebGL
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    //  Load shaders and initialize attribute buffers
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    
    
    
    
    var objectCode = "mtllib untitled.mtl\no Cube\nv 1.000000 -1.000000 -1.000000\nv 1.000000 -1.000000 1.000000\nv -1.000000 -1.000000 1.000000\nv -1.000000 -1.000000 -1.000000\nv 1.000000 1.000000 -0.999999\nv 0.999999 1.000000 1.000001\nv -1.000000 1.000000 1.000000\nv -1.000000 1.000000 -1.000000\nusemtl Material\ns off\nf 1 2 3 4\nf 5 8 7 6\nf 1 5 6 2\nf 2 6 7 3\nf 3 7 8 4\nf 5 1 4 8\n";
    
    
    /* Read the vertices */
    var vertexList = new Array();
    var k = 0;
    var i = 0;
    
    // Skip the two first lines
    while (objectCode.charAt(i) != '\n') {
        i++;
    }
    i++;
    while (objectCode.charAt(i) != '\n') {
        i++;
    }
    i++;

    console.log(objectCode.charAt(i));
    
    // Read each vertex
    while (objectCode.charAt(i) == 'v') {
        i += 2;
        var j;
        for (j = i; objectCode.charAt(j) != ' '; j++);
        var number1 = parseFloat(objectCode.substr(i, j-1));

        i = j + 1;
        for (j = i; objectCode.charAt(j) != ' '; j++);
        var number2 = parseFloat(objectCode.substr(i, j-1));
        
        i = j + 1;
        for (j = i; objectCode.charAt(j) != '\n'; j++);
        var number3 = parseFloat(objectCode.substr(i, j-1));
        
        i = j + 1;
        
        console.log(number1.toString());
        console.log(number2.toString());
        console.log(number3.toString());
        
        vertexList[k] = number1;
        k++;
        vertexList[k] = number2;
        k++;
        vertexList[k] = number3;
        k++;
    }
    
    
    
    // Read each cube's face
    
    
    
    
    
    var vertices = [
        vec2(  0,  1 ),
        vec2(  1,  0 ),
        vec2( -1,  0 ),
        vec2(  0, -1 )
    ];
    
    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    thetaLoc = gl.getUniformLocation( program, "theta" );

    render();
};


function render() {
    
    gl.clear( gl.COLOR_BUFFER_BIT );

    theta += 0.1;
    gl.uniform1f( thetaLoc, theta );

    gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );

    window.requestAnimFrame(render);
}




function vertexNumber(vertexList, i) {
    var vertex = new Array();
    vertex[0] = vertexList[3*i];
    vertex[1] = vertexList[3*i + 1];
    vertex[2] = vertexList[3*i + 2];
    
    return vertex;
}


