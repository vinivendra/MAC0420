
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
    
    
    
    
    
    var objectCode = "mtllib untitled.mtl\n\
    o Cube\n\
    v 1.000000 -1.000000 -1.000000\n\
    v 1.000000 -1.000000 1.000000\n\
    v -1.000000 -1.000000 1.000000\n\
    v -1.000000 -1.000000 -1.000000\n\
    v 1.000000 1.000000 -0.999999\n\
    v 0.999999 1.000000 1.000001\n\
    v -1.000000 1.000000 1.000000\n\
    v -1.000000 1.000000 -1.000000\n\
    usemtl Material\n\
    s off\n\
    f 1 2 3 4\n\
    f 5 8 7 6\n\
    f 1 5 6 2\n\
    f 2 6 7 3\n\
    f 3 7 8 4\n\
    f 5 1 4 8\n";
    console.log(objectCode);
    
//    var cubeVertices = new Array();
    
    
    
    
    
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
