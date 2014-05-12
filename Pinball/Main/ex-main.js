// ===================================================================================================
/* WebGL */
var canvas;
var gl;

// Tamanho da tela
var screenWidth;
var screenHeight;
// Tamanho antigo da tela, usado para redimensionamentos
var oldWidth;
var oldHeight;

// Tempo entre cada frame
var time;




/* Abridor de arquivos */
fileInput = document.getElementById('files');



// ===================================================================================================
/* Vértices para todas as peças */
var objNames = [];          // Vetor com os nomes dos arquivos *.obj
var objStrings = [];        // Vetor de .obj's

var vertices = [];          // Vértices das peças
var verticesStart = 0;      // Inteiro para saber onde cada peça começa
var points = [];            // Vértices ordenados por face
var previousPointsSize = 0; // Tamanho acumulativo do vetor de vértices,
                            // para saber onde cada peça começa e acaba nele
var colors = [];            // Vetor para calcular as cores dos vértices
var tabSize = 0;            // Número de vértices do tabuleiro
var tabMatrix = mat4();     // Matriz do tabuleiro

// Contadores para os vetores acima
var i = 0;


// Vetor com as informações sobre cada peça
var objects = [];

// =================================================
// Vetor de movimentos das peças
var plays = [];
// Índice atual no vetor
var playIndex = 0;
// Flag para saber se estamos no meio de uma jogada
var isPlaying = 0;
// Variável para contar o tempo do intervalo entre uma jogada e outro
var playIntervalTime = 0;

// Variáveis para saber a posição de um possível en passant
var enPassantLocation = vec2(-1, -1);
var enPassantPawnLocation = vec2(-1, -1);

// Vetor de peoes promovidos
var promoted = [];



// ===================================================================================================
/* Variáveis de view */

// Variáveis usadas no lookat
var eyeAbs = vec3();                // Eye "absoluto", sem considerar o tamanho da janela
var eye = vec3();                   // Eye obtido em função de eyeAbs, mas consideranro o tamanho
var at = vec3();
var up = vec3();
var lookat = mat4();

var orthoZoom = 0.5;                // Variável usada para compensar a falta de zoom da projeção ortogonal

var hasToUpdateLookAt = true;       // Flag para saber se é necessário
                                    // recalcular a componente de rotação da lookat;

// =================================================
/* Variáveis de projeção */
var projectionType = "Persp";       // "Flag" para saber se estamos na ortogonal ou na perspectiva
var projec = mat4();                // Matriz de projeção







// ===================================================================================================
/* Callbacks */
// Keyboard
var currentlyPressedKeys = [];  // Vetor que guarda se uma tecla está apertada ou não

// Mouse
var mouseDown = false;      // Flag que indica se o botão esquerdo está apertado
var mouseRDown = false;     // Flag que indica se o botão direito está apertado
var lastMouseX = null;      // Última posição conhecida do mouse
var lastMouseY = null;      //






// ===================================================================================================
/* Playback */
// Variáveis que controlam a animação das jogadas
var playbackIsPlaying = true;




// ===================================================================================================
/* Variáveis dos shaders */
// Vertex Shader:
var matrixLoc;              // Variável que contém a matriz final (projeção & model-view)
var teamLoc;                // Flag para saber em qual time a peça atual está
var isBoardLoc;             // Flag para saber se estamos desenhando o tabuleiro ou não









// ===================================================================================================
/* Main */
window.onload = function init()
{
    
    /* Inicialização do WebGL */
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    
    // Diz para a janela nos avisar quando o seu tamanho mudar
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Seta os valores do tamanho da tela
    screenWidth = canvas.width;
    screenHeight = canvas.height;
    oldWidth = screenWidth;
    oldHeight = screenHeight;
    
    
    // Lê os *.obj
    objNames = ['torre.obj',
                'cavalo.obj',
                'bispo.obj',
                'rei.obj',
                'rainha.obj',
                'peao.obj',];
    readObj('Tabuleiro.obj');
}



function finishInit() {
    i = 0;
    delete(objNames);
    
    // Inicializa as informações das peças
    initObjects();
    
    // Lê os vértices e as faces do tabuleiro
    readTabVertices(objStrings[0]);
    readTabFaces(objStrings[0]);
    // Lê os vértices e marca inícios e fins das peças
    for (var i = 0; i < objects.length; i++) {
        readVertices(objects[i]);
        readFaces(objects[i]);
    }
    
    
    // Seta a matriz do tabuleiro
    tabMatrix  = [vec4( 0.18,   0.0,   0.0,   0.0),
                  vec4(  0.0, 0.126,   0.0,   0.0),
                  vec4(  0.0,   0.0,  0.18,   0.0),
                  vec4(  0.0,   0.0,   0.0,   1.0)];
    
    var trans  = [vec4(  1.0,   0.0,   0.0,   0.045),
                  vec4(  0.0,   1.0,   0.0,   -0.06),
                  vec4(  0.0,   0.0,   1.0,   0.136),
                  vec4(  0.0,   0.0,   0.0,     1.0)];
    
    tabMatrix = times(trans, tabMatrix);
    
    
    // Liga os callbacks do mouse
    canvas.onmousedown = handleMouseDown;
    document.onmouseup = handleMouseUp;
    document.onmousemove = handleMouseMove;
    
    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;

    
    
    
    /* Configuração do WebGL */
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.8, 0.8, 0.8, 1.0 );
    
    
    
    
    // Enable hidden-surface removal
    gl.enable(gl.DEPTH_TEST);
    
    
    
    
    // Load shaders and initialize attribute buffers
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    
    // Create a buffer object, initialize it, and associate it with the
    // associated attribute variable in our vertex shader
    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.DYNAMIC_DRAW );
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    
    // Idem, para o vetor de "cores"
    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.DYNAMIC_DRAW );
    
    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );
    
    
    
    // Pega as variáveis uniformes dos shaders
    matrixLoc = gl.getUniformLocation(program, "matrix");
    teamLoc = gl.getUniformLocation(program, "team");
    isBoardLoc = gl.getUniformLocation(program, "isBoard");
    
    
    
    // Designa funções para os itens da interface
    document.getElementById("Button1").onclick = changeProjection;
    document.getElementById("Button2").onclick = pausePlayPlayback;
    document.getElementById("Button3").onclick = resetPlays;
    document.getElementById("Button4").onclick = loadDefaultPGN;
    
    
    // Inicializa a matriz lookat na posição inicial desejada (arbitrária)
//    var radius = 1;
//    var theta = 45;
//    var phi = 45;
//    eyeAbs = vec3(radius * Math.cos(theta), radius * Math.sin(theta) * Math.cos(phi), radius * Math.sin(theta) * Math.sin(phi));
    eyeAbs = vec3(1.0, 0.0, 0.0);
    at = vec3(0.0, 0.0, 0.0);
    up = vec3(0.0, 1.0, 0.0);

    
    
    
    // Inicializa a matriz de projeção
    updatePerspective();
    
    
    

    
    // Inicializa o vetor de jogadas (nao deve ficar aqui)
    if (window.File) {
        fileInput.addEventListener('change', handleFileSelect);
    }
    else {
        console.log("API de abertura de arquivos não encontrada. Carregando partida default.");
        
        loadDefaultPGN();
    }
    
    
    // Roda as jogadas, se houver alguma
    runPlays();
    
    
    // Começa o loop de execução
    render();
};























/* LEITURA DE ARQUIVOS */
// Manda o JQuery ler o arquivo 'url'
var readObj = function(url) {
    $.get(url, readObjCallback);
};

// Callback para quando a leitura tiver sido feita,
// já que ela é assíncrona
var readObjCallback = function(obj) {
    // Coloca o novo objeto no vetor
    objStrings.push(obj);
    // Se ainda não acabou, lê o próximo
    if (objStrings.length < 7) {
        readObj(objNames[i]);
        i++;
    }
    // Se já acabou, pode fazer o resto
    else
        finishInit();
};


// Callback da escolha do pgn
function handleFileSelect(evt) {
    var f = fileInput.files[0];               // Vamos rodar apenas o primeiro arquivo
    var reader = new FileReader();
    // Callback da leitura do pgn
    reader.onload = function(e) {
                        newPGN(reader.result);
                     }
    
    reader.readAsText(f);
}


// Carrega o PGN padrao
function loadDefaultPGN() {
    plays = [];
    
    newPlay(5,2,5,4,-1);
    newPlay(5,7,5,5,-1);
    newPlay(7,1,6,3,-1);
    newPlay(2,8,3,6,-1);
    newPlay(6,1,2,5,-1);
    newPlay(1,7,1,6,-1);
    newPlay(2,5,1,4,-1);
    newPlay(7,8,6,6,-1);
    newPlay(5,1,7,1,-1);
    newPlay(6,8,5,7,-1);
    newPlay(6,1,5,1,-1);
    newPlay(2,7,2,5,-1);
    newPlay(1,4,2,3,-1);
    newPlay(4,7,4,6,-1);
    newPlay(3,2,3,3,-1);
    newPlay(5,8,7,8,-1);
    newPlay(8,2,8,3,-1);
    newPlay(3,6,2,8,-1);
    newPlay(4,2,4,4,-1);
    newPlay(2,8,4,7,-1);
    newPlay(3,3,3,4,-1);
    newPlay(3,7,3,6,-1);
    newPlay(3,4,2,5,-1);
    newPlay(1,6,2,5,-1);
    newPlay(2,1,3,3,-1);
    newPlay(3,8,2,7,-1);
    newPlay(3,1,7,5,-1);
    newPlay(2,5,2,4,-1);
    newPlay(3,3,2,1,-1);
    newPlay(8,7,8,6,-1);
    newPlay(7,5,8,4,-1);
    newPlay(3,6,3,5,-1);
    newPlay(4,4,5,5,-1);
    newPlay(6,6,5,4,-1);
    newPlay(8,4,5,7,-1);
    newPlay(4,8,5,7,-1);
    newPlay(5,5,4,6,-1);
    newPlay(5,7,6,6,-1);
    newPlay(2,1,4,2,-1);
    newPlay(5,4,4,6,-1);
    newPlay(4,2,3,4,-1);
    newPlay(4,6,3,4,-1);
    newPlay(2,3,3,4,-1);
    newPlay(4,7,2,6,-1);
    newPlay(6,3,5,5,-1);
    newPlay(1,8,5,8,-1);
    newPlay(3,4,6,7,-1);
    newPlay(6,8,6,7,-1);
    newPlay(5,5,6,7,-1);
    newPlay(5,8,5,1,-1);
    newPlay(4,1,5,1,-1);
    newPlay(7,8,6,7,-1);
    newPlay(5,1,5,3,-1);
    newPlay(6,6,7,5,-1);
    newPlay(5,3,7,5,-1);
    newPlay(8,6,7,5,-1);
    newPlay(2,2,2,3,-1);
    newPlay(6,7,5,6,-1);
    newPlay(1,2,1,3,-1);
    newPlay(5,6,4,6,-1);
    newPlay(1,3,2,4,-1);
    newPlay(3,5,2,4,-1);
    newPlay(1,1,1,5,-1);
    newPlay(2,6,4,5,-1);
    newPlay(6,2,6,3,-1);
    newPlay(2,7,3,8,-1);
    newPlay(7,1,6,2,-1);
    newPlay(3,8,6,5,-1);
    newPlay(1,5,1,7,-1);
    newPlay(7,7,7,6,-1);
    newPlay(1,7,1,6,-1);
    newPlay(4,6,3,5,-1);
    newPlay(6,2,5,1,-1);
    newPlay(4,5,6,4,-1);
    newPlay(7,2,7,3,-1);
    newPlay(6,4,8,3,-1);
    newPlay(5,1,4,2,-1);
    newPlay(3,5,2,5,-1);
    newPlay(1,6,4,6,-1);
    newPlay(2,5,3,5,-1);
    newPlay(4,6,1,6,-1);
    newPlay(8,3,6,2,-1);
    newPlay(7,3,7,4,-1);
    newPlay(6,5,4,3,-1);
    newPlay(1,6,5,6,-1);
    
    resetPlays();
    
    console.log("TODO O HUE");
}























/* INTERFACE */

// Alterna entre a projeção ortogonal e a perspectiva
function changeProjection() {
    // Se era ortogonal, agora é perspectiva
    if (projectionType == "Ortho") {
        updatePerspective();
        projectionType = "Persp";
    }
    // Se era perspectiva, agora é ortogonal
    else {
        updateOrthogonal();
        projectionType = "Ortho";
    }
}

// Dá play ou pause nas animações
function pausePlayPlayback() {
    // Se estava animando, pausa
    if (playbackIsPlaying == true) {
        playbackIsPlaying = false;
    }
    // Se não, dá play
    else {
        playbackIsPlaying = true;
        time = (new Date()).getTime();
    }
}




function resetPlays() {
    // Recomeça as jogadas
    playIndex = 0;
    isPlaying = 0;
    
    // Recoloca as peças
    resetObjects();
}























/* INICIALIZAÇÃO DE OBJETOS */
// Lê os vértices de cada peça e os armazena no vetor
function readVertices(piece) {
    /* Pula as quatro primeiras linhas:
     
     # Blender v2.70 (sub 0) OBJ File: ''
     # www.blender.org
     mtllib bispo.mtl
     o Line02
     */
    
    i = 0;
    for (var bla = 0; bla < 4; bla++) {
        while (piece.string.charAt(i) != '\n') i++;
        i++;
    }
    
    // Para cada linha começada com "v "
    while (piece.string.charAt(i) == 'v' && piece.string.charAt(i+1) != 'n') {
        i += 2;                     // Pula o "v "
        var j;                      // j vai para o fim de cada número
        var vertex = vec4();        // O novo vértice a ser adicionado
        
        // Leitura da coordenada x
        for (j = i; piece.string.charAt(j) != ' '; j++);            // Acha o fim do número
        vertex[0] = parseFloat(piece.string.substr(i, j-1)) / 2;    // Adiciona a coordenada ao novo vértice
        
        // Leitura da coordenada y
        i = j + 1;                                                  // Pula para o número seguinte
        for (j = i; piece.string.charAt(j) != ' '; j++);
        vertex[1] = parseFloat(piece.string.substr(i, j-1)) / 2;
        
        // Leitura da coordenada z
        i = j + 1;
        for (j = i; piece.string.charAt(j) != '\n'; j++);
        vertex[2] = parseFloat(piece.string.substr(i, j-1)) / 2;
        
        i = j + 1;      // Vai para a próxima linha
        
        vertex[3] = 1.0;            // Coordenada homogênea
        
        // Coloca o novo vértice na lista
        vertices.push( vertex );
    }
    
}

// Análoga à função acima, para o tabuleiro
function readTabVertices(string) {
    /* Pula as quatro primeiras linhas:
     
     # Blender v2.70 (sub 0) OBJ File: ''
     # www.blender.org
     mtllib bispo.mtl
     o Line02
     */
    i = 0;
    for (var bla = 0; bla < 4; bla++) {
        while (string.charAt(i) != '\n') i++;
        i++;
    }
    
    // Para cada linha começada com "v "
    while (string.charAt(i) == 'v' && string.charAt(i+1) != 'n') {
        i += 2;                     // Pula o "v "
        var j;                      // j vai para o fim de cada número
        var vertex = vec4();        // O novo vértice a ser adicionado
        
        // Leitura da coordenada x
        for (j = i; string.charAt(j) != ' '; j++);            // Acha o fim do número
        vertex[0] = parseFloat(string.substr(i, j-1)) / 2;    // Adiciona a coordenada ao novo vértice
        
        // Leitura da coordenada y
        i = j + 1;                                                  // Pula para o número seguinte
        for (j = i; string.charAt(j) != ' '; j++);
        vertex[1] = parseFloat(string.substr(i, j-1)) / 2;
        
        // Leitura da coordenada z
        i = j + 1;
        for (j = i; string.charAt(j) != '\n'; j++);
        vertex[2] = parseFloat(string.substr(i, j-1)) / 2;
        
        i = j + 1;      // Vai para a próxima linha
        
        vertex[3] = 1.0;            // Coordenada homogênea
        
        // Coloca o novo vértice na lista
        vertices.push( vertex );
    }
    
}


// Lê as faces, ou seja, os grupos de vértices correspondentes
// a faces e coloca esses grupos em um novo vetor
function readFaces(piece) {
    // Pula todas as linhas "vn ", que não vai ser usadas por enquanto
    while (piece.string.charAt(i) == 'v') {
        while (piece.string.charAt(i) != '\n') i++;
        i++;
    }
    
    /* Pula mais duas linhas:
     
     usemtl wire_255255255
     s off
     */
    while (piece.string.charAt(i) != '\n') i++;
    i++;
    while (piece.string.charAt(i) != '\n') i++;
    i++;
    
    // Para cada face
    while (piece.string.charAt(i) == 'f') {
        i += 2;                 // Pula o "f "
        var j;                  // Vai para o fim de cada número
        
        var number = [];        // Triângulo a ser adicionado (índice dos 3 vértices na lista)
        
        // Primeiro vértice
        for (j = i; piece.string.charAt(j) != '/'; j++);          // Lê até a primeira '/'
        number[0] = parseInt(piece.string.substr(i, j-1)) - 1;    // Adiciona o número
        for (i = j; piece.string.charAt(i) != ' '; i++);          // Pula o resto, que por
                                                                  // enquanto não vamos usar
        i++;
        
        // Segundo vértice
        for (j = i; piece.string.charAt(j) != '/'; j++);
        number[1] = parseInt(piece.string.substr(i, j-1)) - 1;
        for (i = j; piece.string.charAt(i) != ' '; i++);
        i++;
        
        // Terceiro vértice
        for (j = i; piece.string.charAt(j) != '/'; j++);
        number[2] = parseInt(piece.string.substr(i, j-1)) - 1;
        for (i = j; piece.string.charAt(i) != '\n'; i++);
        i++;
        
        // Adiciona os vértices, em ordem, ao vetor de "pontos"
        for (var k = 0; k < 3; k++)
            points.push(vertices[verticesStart + number[k]]);
        
        // Adiciona as cores ao vetor de cores
        for (var k = 0; k < 3; k++) {
            var c = vertices[verticesStart + number[k]][1];
            var col = vec4(c, c, c, 1.0);
            colors.push(col);
        }
        


    }
    
    // Configura a peça para saber onde é
    // o começo e o final dos seus vértices na lista
    piece.vertexStart = previousPointsSize;
    previousPointsSize = points.length;
    piece.vertexEnd = points.length;
    
    verticesStart = vertices.length;
}



// Equivalente ao método acima, mas especificamente para o tabuleiro
function readTabFaces(string) {
    // Pula todas as linhas "vn ", que não vai ser usadas por enquanto
    while (string.charAt(i) == 'v') {
        while (string.charAt(i) != '\n') i++;
        i++;
    }
    
    /* Pula mais duas linhas:
     
     usemtl Material.003
     s off
     */
    while (string.charAt(i) != '\n') i++;
    i++;
    while (string.charAt(i) != '\n') i++;
    i++;
    
    var c = [vec4(144/256, 103/256, 68/256), // Tab cor 1
             vec4(144/256, 103/256, 68/256), // Tab cor 2
             vec4(230/256, 217/256, 196/256), // Casas cor 1
             vec4(123/256, 58/256, 50/256), // Casas cor 2
             ];
    var count = 0;
    
    // Para cada face
    while (string.charAt(i) == 'f' || string.charAt(i) == 'u') {
        // Se estamos lendo uma face nova
        if (string.charAt(i) == 'f') {
            i += 2;                 // Pula o "f "
            var j;                  // Vai para o fim de cada número
            
            var number = [];        // Triângulo a ser adicionado (índice dos 3 vértices na lista)
            
            // Primeiro vértice
            for (j = i; string.charAt(j) != '/'; j++);          // Lê até a primeira '/'
            number[0] = parseInt(string.substr(i, j-1)) - 1;    // Adiciona o número
            for (i = j; string.charAt(i) != ' '; i++);          // Pula o resto, que por
                                                                // enquanto não vamos usar
            i++;
            
            // Segundo vértice
            for (j = i; string.charAt(j) != '/'; j++);
            number[1] = parseInt(string.substr(i, j-1)) - 1;
            for (i = j; string.charAt(i) != ' '; i++);
            i++;
            
            // Terceiro vértice
            for (j = i; string.charAt(j) != '/'; j++);
            number[2] = parseInt(string.substr(i, j-1)) - 1;
            for (i = j; string.charAt(i) != '\n'; i++);
            i++;
            
            // Adiciona os vértices, em ordem, ao vetor de "pontos"
            for (var k = 0; k < 3; k++)
                points.push(vertices[verticesStart + number[k]]);
            
            // Adiciona as cores ao vetor de cores
            colors.push(c[count]);
            colors.push(c[count]);
            colors.push(c[count]);
        }
        // Se vamos mudar de material
        else if (string.charAt(i) == 'u') {
            count++;
            
            // Vai até a próxima linha
            while (string.charAt(i) != '\n') i++;
            i++;
        }
    }
    
    // Configura a peça para saber onde é
    // o começo e o final dos seus vértices na lista
    previousPointsSize = points.length;
    tabSize = points.length;
    
    verticesStart = vertices.length;
}


// Inicializa as peças, com todas as informações necessárias
function initObjects() {
    var k = 1;
    
    var rooks = {string: objStrings[k], vertexStart: 0, vertexEnd: 0, instances: []};
    rooks.instances.push(piece(0, 0, 0, 0));
    rooks.instances.push(piece(0, 7, 0, 0));
    rooks.instances.push(piece(1, 0, 7, 0));
    rooks.instances.push(piece(1, 7, 7, 0));
    objects.push(rooks);
    k++;

    // Os cavalos precisam ser girados em 90 graus
    var knights = {string: objStrings[k], vertexStart: 0, vertexEnd: 0, instances: []};
    knights.instances.push(piece(0, 1, 0, 1));
    knights.instances[knights.instances.length - 1].rotateY(90);
    knights.instances.push(piece(0, 6, 0, 1));
    knights.instances[knights.instances.length - 1].rotateY(90);
    knights.instances.push(piece(1, 1, 7, 1));
    knights.instances[knights.instances.length - 1].rotateY(90);
    knights.instances.push(piece(1, 6, 7, 1));
    knights.instances[knights.instances.length - 1].rotateY(90);
    objects.push(knights);
    k++;
    
    var bishops = {string: objStrings[k], vertexStart: 0, vertexEnd: 0, instances: []};
    bishops.instances.push(piece(0, 2, 0, 2));
    bishops.instances.push(piece(0, 5, 0, 2));
    bishops.instances.push(piece(1, 2, 7, 2));
    bishops.instances.push(piece(1, 5, 7, 2));
    objects.push(bishops);
    k++;
    
    var kings = {string: objStrings[k], vertexStart: 0, vertexEnd: 0, instances: []};
    kings.instances.push(piece(0, 4, 0, 3));
    kings.instances.push(piece(1, 4, 7, 3));
    objects.push(kings);
    k++;
    
    var queens = {string: objStrings[k], vertexStart: 0, vertexEnd: 0, instances: []};
    queens.instances.push(piece(0, 3, 0, 4));
    queens.instances.push(piece(1, 3, 7, 4));
    objects.push(queens);
    k++;
    

    var pawns = {string: objStrings[k], vertexStart: 0, vertexEnd: 0, instances: []};
    for (var i = 0; i < 8; i++) {
        pawns.instances.push(piece(0, i, 1, 5));
        pawns.instances.push(piece(1, i, 6, 5));
    }
    objects.push(pawns);
}


// Cria uma nova peça no time TEAM e na posição (X, Y) (medida em casas) do tabuleiro
function piece (team, x, y, job) {
    // Acha a direção para a qual a peça está olhando
    var direction;
    if (team) direction = -1.0;
    else direction = 1.0;
    
    // Tamanho padrão das peças
    var size = 0.2;
    
    // Cria a peça
    var piece = ({
                 exists: true,                      // Se a peça ainda existe
                 color: team,                       // O time da peça
                 job: job,                        // O tipo da peça (rei, rainha, etc)
                 position: vec3(),                  // Posição no mundo
                 scale: vec3( direction, 1.0, 1.0 ),// Escala da peça
                 translation: mat4(),               // Matriz pessoal de translação
                 rotation: mat4(),                  // Idem, para rotação
                 scaling: mat4(),                   // Idem, para escala
                 matrix: mat4(),                    // Junção das três acima
                 hasToUpdateMatrix: false,          // Flag para saber quando remultiplicá-las
                 
                 location: vec2(x, y),              // Posição no tabuleiro, medida em casas
                 
                 originalLocation: vec2(x, y),      // Posição inicial no tabuleiro ("read-only")
                 
                 translate: translate,              // Funções de transformação geométrica
                 setPosition: setPosition,          // Equivale a uma translação
                 rescale: rescale,
                 setScale: setScale,
                 rotateY: rotateY,                  // Roda a peça no eixo y
                 getMatrix: getMatrix,              // Devolve a 'matrix'
                 
                 promotion: -1,                     // Se a peça foi promovida ou não
                 });
    
    
    // Translada a peça para o lugar certo
    var loc = boardToWorld(piece.location);
    piece.setPosition(loc);
    // Escala a peça para o tamanho certo e muda ela de direção se necessário
    piece.rescale(size, size, size);
    
    return piece;
}



// Reseta os objetos para recomeçar a partida
function resetObjects() {
    for (var i = 0; i < objects.length; i++) {
        for (var j = 0; j < objects[i].instances.length; j++) {
            // Pega a peça atual
            var p = objects[i].instances[j];
            
            // Acha a direção para a qual a peça está olhando
            var direction;
            if (p.color) direction = -1.0;
            else direction = 1.0;
            
            // Tamanho padrão das peças
            var size = 0.2;

            // Reseta tudo o que precisar das peças
            p.exists = true;                    // A peça volta a existir
            p.position = vec3();                // Reseta: posição no mundo;
            p.scale = vec3( direction, 1.0, 1.0 );  // escala da peça;
            p.translation = mat4();             // matriz pessoal de translação;
            p.scaling = mat4();                 // idem, para escala;
            p.matrix = mat4();                  // junção das três acima;
            p.hasToUpdateMatrix = true;         // e precisamos recriar tudo.
            p.location = vec2(p.originalLocation[0], p.originalLocation[1]);    // Posição no tabuleiro em casas
            
            
            // Translada a peça para o lugar certo
            var loc = boardToWorld(p.location);
            p.setPosition(loc);
            // Escala a peça para o tamanho certo e muda ela de direção se necessário
            p.rescale(size, size, size);
            
            p.promotion = -1;
        }
    }
    
    promoted = [];
}


// Promove um peão
function promote(piece, i) {
    piece.job = i;
    piece.hasToUpdateMatrix = true;
    piece.promotion = i;
    promoted.push(piece);
    
    // Se for um cavalo, roda ele
    if (i == 1) {
        piece.rotation = mat4();
        piece.rotateY(90);
    }
}
































/*  Jogadas */
// Lê um arquivo PGN e cria uma nova jogada
function newPGN(string) {
    var i = 0;
    plays = [];
    var newJob = -1;
    
    // Pula linhas em branco
    while (string.charAt(i) == '\n')
        i++;
    
    // Pula todas as linhas que começarem com '['
    while (string.charAt(i) == '[') {
        while (string.charAt(i) != '\n')
            i++;
        i++;
    }

    // Pula linhas em branco
    while (string.charAt(i) == '\n')
        i++;
    
    while (string.length > i + 1) {
        // Se for um comentário
        if (string.charAt(i+1) == '{') {
            while (string.charAt(i) != '}')
                i++;
        }
        // Se não
        else {
            // Pula o número e o ponto
            while (string.length > i + 1) {
                if (((string.charAt(i) == ' ') || (string.charAt(i) == '\n'))) {
                    if ((string.charAt(i+2) != '.') && (string.charAt(i+3) != '.') && (string.charAt(i+4) != '.')) {
                        break;
                    }
                    else {
                        i++;
                    }
                }
                else {
                    i++;
                }
            }
            
            i++;
            
            // Lê a letra da origem
            var c = string.charAt(i);
            c = rowForChar(c);
            i++;
            
            if (c != 9) {
                
                // Lê o número da origem
                var n = parseInt(string.substr(i, i));
                
                // Pula o traço
                i += 2;
                
                // Lê a letra do destino
                var c2 = string.charAt(i);
                c2 = rowForChar(c2);
                i++;
                
                // Lê o número do destino
                var n2 = parseInt(string.substr(i, i));
                i++;
                
                newJob = -1;
                
                // Se tem uma letra depois é porque um peao foi promovido
                if (string.charAt(i) != ' ' && string.charAt(i) != '\n' && string.charAt(i) != '{') {
                    if (string.charAt(i) == 'r') newJob = 0;
                    if (string.charAt(i) == 'n') newJob = 1;
                    if (string.charAt(i) == 'b') newJob = 2;
                    if (string.charAt(i) == 'q') newJob = 4;
                }
                
                newPlay(c, n, c2, n2, newJob);
            }
            else {
                i = 99999999999;
            }
        }
    }
    
    resetPlays();
    
}


// Retorna o número de uma fila a partir da letra correspondente
function rowForChar(c) {
    if (c == "a") return 1;
    if (c == "b") return 2;
    if (c == "c") return 3;
    if (c == "d") return 4;
    if (c == "e") return 5;
    if (c == "f") return 6;
    if (c == "g") return 7;
    if (c == "h") return 8;
    
    return 9;
}







// Cria uma nova jogada e insere ela no vetor
function newPlay (fromX, fromY, toX, toY, promotion) {
    fromX -= 1;
    fromY -= 1;
    toX -= 1;
    toY -= 1;
    
    var p = ({piece: 0,                                  // A peça que vai se mover
             
             bOrigin: vec2(fromX, fromY),               // Origem no tabuleiro
             bDestination: vec2(toX, toY),              // Destino no tabuleiro
             wOrigin: boardToWorld(vec2(fromX, fromY)), // Origem no mundo
             wDestination: boardToWorld(vec2(toX, toY)),// Destino no mundo
             direction: vec3(),                         // Vetor unitário de direção (no mundo)
             
             init:initPlay,                             // Inicializa as informações de acordo com
                                                        // a situação instantânea do tabuleiro
             
             deadPiece: null,                           // A peça em si
             
             promotion: promotion,                      // Indica a peça que um peão se torna se for promovido
             isEnPassant: false,                        // Flag para saber se a jogada é um en passant
             isDouble: false,                           // Flag para saber se a jogada é um roque
             secondPiece: null,                         // A torre em si

                                                        // O equivalente, referente à torre do roque
                                                        // (se houver)
             bSOrigin: null,                            // Origem no tabuleiro
             bSDestination: null,                       // Destino no tabuleiro
             wSOrigin: null,                            // Origem no mundo
             wSDestination: null,                       // Destino no mundo
             sDirection: null,                          // Vetor unitário de direção (no mundo)
             
             });
    
    
    // Adiciona a nova jogada ao vetor de jogadas
    plays.push(p);
}

// Inicializa os valores da jogada que precisam ser pegos na hora
function initPlay() {
    // Pega a peça principal
    this.piece = getPiece(this.bOrigin[0], this.bOrigin[1]);
    
    // Se não tivermos uma peça
    if (this.piece == null)
        console.log("ERRO! Não existe peça na posição ", this.bOrigin);
    
    
    // Se a peça for um rei
    if (this.piece.job == 3) {
        // Se a jogada for um roque (se o rei se mover mais de uma casa)
        if ((this.bDestination[0] - this.bOrigin[0] > 1) || (this.bDestination[0] - this.bOrigin[0] < -1)) {
            this.isDouble = true;
            
            if (this.bDestination[0] - this.bOrigin[0] > 1) {
                // Pega a linha (brancas ou pretas?)
                var i = this.bOrigin[1];
                
                // Pega a torre da direita
                this.secondPiece = getPiece(7, i);
                this.bSOrigin = vec2(7, i);
                this.wSOrigin = boardToWorld(vec2(7, i));
                this.bSDestination = vec2(5, i);
                this.wSDestination = boardToWorld(vec2(5, i));
            }
            else {
                // Pega a linha (brancas ou pretas?)
                var i = this.bOrigin[1];
                
                // Pega a torre da direita
                this.secondPiece = getPiece(0, i);
                this.bSOrigin = vec2(0, i);
                this.wSOrigin = boardToWorld(vec2(0, i));
                this.bSDestination = vec2(3, i);
                this.wSDestination = boardToWorld(vec2(3, i));
            }
            
            // Cria o vetor de direção e normaliza ele
            this.sDirection = vec3(this.wSDestination[0] - this.wSOrigin[0], this.wSDestination[1] - this.wSOrigin[1], this.wSDestination[2] - this.wSOrigin[2]);
            
            var n = norm3(this.sDirection);
            this.sDirection = vec3(this.sDirection[0]/n, this.sDirection[1]/n, this.sDirection[2]/n);
            
        }
    }
    
    
    this.deadPiece = null;
    
    // Se for um peão
    if (this.piece.job == 5) {
        // Checa se ele está andando duas casas
        if ((this.bDestination[1] - this.bOrigin[1] > 1) || (this.bDestination[1] - this.bOrigin[1] < -1)) {
            // Se estiver, está sujeito a um en passant
            // A peça seguinte deve ir para esta posição para fazer o en passant:
            var y = (this.bDestination[1] + this.bOrigin[1]) / 2.0;
            enPassantLocation = vec2(this.bOrigin[0], y);
            // E se fizer vai comer este peão:
            enPassantPawnLocation = this.bDestination;
        }
    }
    // Se a jogada está sujeita a ser um en passant
    else if (enPassantLocation[0] != -1) {
        
        // Se a peça está indo para aquele lugar
        if (this.bDestination[0] == enPassantLocation[0] && this.bDestination[1] == enPassantLocation[1]) {
            
            // A jogada é um en passant
            this.isEnPassant = true;
            
            // Vai comer o peão:
            this.deadPiece = getPiece(enPassantPawnLocation[0], enPassantPawnLocation[1]);
        }
        else {
            enPassantLocation = vec2(-1, -1);
            enPassantPawnLocation = vec2(-1, -1);
        }
    }
    
    
    
    
    if (this.deadPiece == null) {
        // Em jogadas normais (nao-en-passant), a peça comida é a que está no destino
        this.deadPiece = getPiece(this.bDestination[0], this.bDestination[1]);
    }
    
    
    
    
    
    // Seta os valores que precisar
    this.bOrigin = this.piece.location;
    this.wOrigin = this.piece.position;
    
    
    // Cria o vetor de direção e normaliza ele
    this.direction = vec3(this.wDestination[0] - this.wOrigin[0], this.wDestination[1] - this.wOrigin[1], this.wDestination[2] - this.wOrigin[2]);
    
    var n = norm3(this.direction);
    this.direction = vec3(this.direction[0]/n, this.direction[1]/n, this.direction[2]/n);
}


// Roda a primeira jogada da fila
function runPlays () {
    if (playbackIsPlaying == true) {            // Roda só se não estiver pausado

        if (playIndex < plays.length) {         // Se ainda tem alguma jogada para rodar

            if (isPlaying == 0) {               // Se estamos começando uma nova jogada
                
                // Time vai ser o instante em que a jogada começou
                time = (new Date()).getTime();
                
                // A jogada começou
                isPlaying = 1;
                
                // Inicializa a jogada
                plays[playIndex].init();
                
            }

            else if (isPlaying == 1) {                              // Se estamos no meio de uma jogada
                // Pega a próxima jogada a executar e a peça dela
                var play = plays[playIndex];
                var piece = play.piece;
                
                // Pega o intervalo de tempo passado desde a última atualização
                var newTime = (new Date()).getTime();
                var dt = (newTime - time)/1000;
                time = newTime;
                // Define a velocidade de andamento da peça
                var speed = 0.2;
                // E define o vetor de deslocamento dela
                var desloc = vec3(play.direction[0] * speed * dt, play.direction[1] * speed * dt, play.direction[2] * speed * dt);
                
                // Descobre quanto a peça ainda pode andar
                // limit = wDestination - position
                var limit = vec3(play.wDestination[0] - piece.position[0], play.wDestination[1] - piece.position[1], play.wDestination[2] - piece.position[2]);
                
                
                
                
                // Checa se a jogada é um roque
                var rookDesloc;
                if (play.isDouble == true) {
                    // Se for um roque longo, a torre precisa andar mais rápido
                    if (play.bSOrigin[0] == 0)
                        speed = 0.3;
                    
                    rookDesloc = vec3(play.sDirection[0] * speed * dt, play.sDirection[1] * speed * dt, play.sDirection[2] * speed * dt);
                }
                
                
                
                
                // Se estamos nos aproximando de uma peça a ser comida
                if (norm3(limit) < 0.05 && play.deadPiece != null) {
                    play.deadPiece.exists = false;
                }
                
                
                if (norm3(desloc) > norm3(limit)) {     // Se vamos andar (desloc) mais do que podemos (limit)
                    // Então só vamos andar até onde der
                    desloc = limit;
                    
                    // E vamos transladar exatamente para aquela posição
                    piece.setPosition(play.wDestination);
                    
                    // E essa jogada já acabou
                    isPlaying = 2;
                    
                    // Se for um roque, coloca a torre no lugar certo também
                    if (play.isDouble)
                        play.secondPiece.setPosition(play.wSDestination);
                    
                    // Se foi um peão promovido, muda a peça
                    if (play.promotion > -1) {
                        promote(piece, play.promotion);
                    }
                    
                }
                else {                      // Se ainda não acabou
                    // Translada a peça um pouco naquela direção
                    piece.translate(desloc[0], desloc[1], desloc[2]);
                    
                    // Se for um roque, translada a torre também
                    if (play.isDouble)
                        play.secondPiece.translate(rookDesloc[0], rookDesloc[1], rookDesloc[2]);
                }
                
                
                

                if (isPlaying == 2) {       // Se a jogada já acabou
                    // Arruma a posição da peça no tabuleiro
                    piece.location = play.bDestination;
                    // Se for roque, arruma a torre também
                    if (play.isDouble)
                        play.secondPiece.location = play.bSDestination;
                        
                    // Remove a peça morta do tabuleiro, caso haja alguma
                    if (play.deadPiece != null) {
                        play.deadPiece.exists = false;
                        play.deadPiece.location = vec2(-1, -1);
                    }
                    
                    // Vamos para a próxima jogada
                    playIndex++;
                }
                
            }
            
            else if (isPlaying == 2) {
                var newTime = (new Date()).getTime();
                
                // Damos 1 segundo de intervalo
                if (newTime > time + 1000) {
                    isPlaying = 0;
                }
            }
        }
    }
}


// Acha a peça a ser movida, a que está na posição (x,y) do tabuleiro
// Retorna o seu índice no vetor objects e no vetor instances,
// para podermos achar a peça mesmo que o vetor mude
function getPiece(x, y) {
    // Para cada peça
    for (var i = 0; i < objects.length; i++) {
        for (var j = 0; j < objects[i].instances.length; j++) {
            
            var piece = objects[i].instances[j];
            // Se a peça está na posição (x,y) do tabuleiro
            if (piece.location[0] == x && piece.location[1] == y) {
                return piece;
            }
        }
    }
    
    return null;
}
















































/* MATRIZES DE ORIENTAÇÃO DOS OBJETOS */
// Translação
function translate(x, y, z) {
    // Soma os valores à posição da peça
    this.position[0] += x;
    this.position[1] += y;
    this.position[2] += z;
    
    // Cria a matriz correspondente ao movimento do vetor (x, y, z)
    this.translation = [
                        vec4(  1,  0,  0,  this.position[0] ),
                        vec4(  0,  1,  0,  this.position[1] ),
                        vec4(  0,  0,  1,  this.position[2] ),
                        vec4(  0,  0,  0,  1 )
                        ];
    
    
    // Seta a flag para recriarmos a matriz geral deste objeto
    this.hasToUpdateMatrix = true;
}

function setPosition(newPosition) {
    // Soma os valores à posição da peça
    this.position[0] = newPosition[0];
    this.position[1] = newPosition[1];
    this.position[2] = newPosition[2];
    
    // Cria a matriz correspondente ao movimento do vetor (x, y, z)
    this.translation = [
                        vec4(  1,  0,  0,  this.position[0] ),
                        vec4(  0,  1,  0,  this.position[1] ),
                        vec4(  0,  0,  1,  this.position[2] ),
                        vec4(  0,  0,  0,  1 )
                        ];
    
    
    // Seta a flag para recriarmos a matriz geral deste objeto
    this.hasToUpdateMatrix = true;
}

// Escala
function rescale(x, y, z) {
    // Análogo ao método acima
    this.scale[0] *= x;
    this.scale[1] *= y;
    this.scale[2] *= z;
    
    this.scaling = [
                    vec4(  this.scale[0],  0,  0,  0 ),
                    vec4(  0,  this.scale[1],  0,  0 ),
                    vec4(  0,  0,  this.scale[2],  0 ),
                    vec4(  0,  0,  0,  1 )
                    ];
    
    this.hasToUpdateMatrix = true;
}

function setScale(x, y, z) {
    // Análogo ao método acima
    this.scale[0] = x;
    this.scale[1] = y;
    this.scale[2] = z;
    
    this.scaling = [
                    vec4(  this.scale[0],  0,  0,  0 ),
                    vec4(  0,  this.scale[1],  0,  0 ),
                    vec4(  0,  0,  this.scale[2],  0 ),
                    vec4(  0,  0,  0,  1 )
                    ];
    
    this.hasToUpdateMatrix = true;
}

function rotateY(t) {
    var a = radians(t);
    var s = Math.sin(a);
    var c = Math.cos(a);
    
    this.rotation = [
                    vec4(  c,  0, -s,  0 ),
                    vec4(  0,  1,  0,  0 ),
                    vec4(  s,  0,  c,  0 ),
                    vec4(  0,  0,  0,  1 )
                    ];
    
    this.hasToUpdateMatrix = true;
}

// Junta escala, translação e rotação dos objetos
function getMatrix() {
    if (this.hasToUpdateMatrix) {
        this.matrix = times(times(this.translation, this.rotation), this.scaling);
        this.hasToUpdateMatrix = false;
    }
    
    return this.matrix;
}





















/* MATRIZES DE ORIENTAÇÃO DA CENA */
// Devolve a matriz correspondente à rotação do p=(0, 1, 0) para um outro vetor,
// o q=(x,y,z) na esfera unitária correspondente ao v = (x,z) dado.
function RotTrackball(v) {
    // Matriz que vamos retornar
    var m = mat4();
    
    var x = eyeAbs;
    var n = norm3(eyeAbs);
    x = vec3(x[0]/n, x[1]/n, x[2]/n);
    
    
    var y = up;
    n = norm3(up);
    y = vec3(y[0]/n, y[1]/n, y[2]/n);


    
    var z = vcross(x, y);
    n = norm3(z);
    z = vec3(z[0]/n, z[1]/n, z[2]/n);
    

    
    v = vec2(1.5 * v[0]/(screenWidth*2), 1.5 * v[1]/(screenHeight*2));
    var vz = getZ(v);
    

    
    var newEye = vec3(z[0] * v[0] + y[0] * v[1] + x[0] * vz,
                      z[1] * v[0] + y[1] * v[1] + x[1] * vz,
                      z[2] * v[0] + y[2] * v[1] + x[2] * vz);
    
    
    
    var c = vcross(x, newEye);
    n = norm3(c);
    
    if (n != 0) {
        c = vec3(c[0]/n, c[1]/n, c[2]/n);
        
        
        up = quatRot(up, c, angle(x, newEye));
        n = norm3(up);
        up = mult3(1.0/n, up);
        
        
        n = norm3(newEye);
        newEye = mult3(1.0/n, newEye);
        eyeAbs = newEye;
    }
    
    hasToUpdateLookAt = true;
    
    return m;
    
    
//
//    // Cria o p
//    var p = vec3(0.0, 0.0, 1.0);
//    
//    // Acha o q na esfera
//    v = vec2(-v[0]/(screenWidth*2), -v[1]/(screenHeight*2));
//    var q = vec3(v[0], v[1], getZ(v));
//    
//    // Calcula o vetor pelo qual rodar e o ângulo de rotação sobre ele
//    var c = vcross(p, q);
//    
//    var a = angle(p, q);
//    
//    
//    // Calcula a norma do vetor resultante
//    var n = norm3(c);
//    
//    
//    // Se a norma for 0 é porque a diferença entre p e q é pequena
//    // demais. Por isso, e para não dividirmos algo por 0, ignoramos
//    // essa rotação.
//    if (n != 0) {
//        // Normaliza o vetor
//        c = vec4(c[0]/n, c[1]/n, c[2]/n, 0.0);
//        
//        // Por causa do jeito como criamos p, este vetor está
//        // no plano z = 0. Queremos rodá-lo até o eixo y. Para isso,
//        // Consideramos o ângulo entre c e o eixo y.
//        
//        // A componente x do vetor vai ser o seno do ângulo
//        // entre c e o eixo y. A componente y vai ser o cosseno.
//        
//        // Calcula a rotação em z
//        var Rz  = [vec4(  c[1],   c[0],  0.0,   0.0),
//                   vec4( -c[0],   c[1],  0.0,   0.0),
//                   vec4(   0.0,   0.0,   1.0,   0.0),
//                   vec4(   0.0,   0.0,   0.0,   1.0) ];
//        
//        // E a rotação de volta, com o ângulo negativo
//        var Rmz = [vec4(  c[1],  -c[0],  0.0,   0.0),
//                   vec4(  c[0],   c[1],  0.0,   0.0),
//                   vec4(   0.0,   0.0,   1.0,   0.0),
//                   vec4(   0.0,   0.0,   0.0,   1.0) ];
//        
//        // Calcula a rotação em y
//        // a é o ângulo entre p e q, o ângulo em que queremos
//        // rodar cena
//        var cos = Math.cos(a);
//        var sin = Math.sin(a);
//        
//        var Ry = [vec4( cos, 0.0, -sin, 0.0),
//                  vec4( 0.0, 1.0,  0.0, 0.0),
//                  vec4( sin, 0.0,  cos, 0.0),
//                  vec4( 0.0, 0.0,  0.0, 1.0) ];
//        
//        // Calcula a rotação final
//        // R = R(-z)R(y)R(z)
//        var m = times(Rmz, times(Ry, Rz));
//    }
//    // Se a norma for 0, vamos usar a matriz identidade criada na
//    // declaração de m, que equivale a uma rotação por 0 graus.
//    
//    
    return m;
}

// Joga a matriz de rotação para os vetores do lookat
function finalizeRotation() {
    // Roda o eyeAbs e o up do LookAt
    if (hasToUpdateLookAt) {
        updateEye();                            // Calcula o eye baseado no eyeAbs e
                                                // no tamanho da janela
        
        lookat = lookAt(eye, at, up);           // Calcula o lookat
        
        hasToUpdateLookAt = false;
    }
}

































/* MATRIZES DE PROJEÇÃO */
// Cria e seta a matriz de perspectiva
function updatePerspective() {
    projec = perspective(60, canvas.width/canvas.height, 2.0, 0.0001);
}

// Idem, para a ortogonal
function updateOrthogonal() {
    // Redimensiona baseado na menor dimensão
    var minNovo = Math.min(canvas.clientHeight, canvas.clientWidth);
    minNovo = Math.max(minNovo, 1);                 // Para não dividir por 0
    
    var minVelho = Math.min(oldHeight, oldWidth);
    minVelho = Math.max(minVelho, 1);                 // Para não dividir por 0
    
    var ratio = minVelho / minNovo;
    
    projec = ortho(orthoZoom * ratio * -canvas.width/canvas.height, orthoZoom * ratio * canvas.width/canvas.height, orthoZoom * ratio * -1, orthoZoom * ratio * 1, orthoZoom * ratio * -4.1, orthoZoom * ratio * -0.1);
}



































/* CALLBACKS */

// Lida com o redimensionamento da tela
function resizeCanvas() {
    // Guarda os valores anteriores
    var wAntigo = canvas.width;
    var hAntigo = canvas.height;
    
    // Pega o novo tamanho da nossa janela
    if (canvas.width != canvas.clientWidth || canvas.height != canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }
    
    // Redimensiona o tamanho do viewPort
    gl.viewport( 0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight );
    
    // Arruma a projeção
    if (projectionType == "Ortho") {
        updateOrthogonal();
    }
    else {
        updatePerspective();
    }
    
    
    // Arruma o zoom
    updateEye();
    
}

// Lida com o botão do mouse sendo apertado
function handleMouseDown(event) {
    // Seta a flag dizendo para outras funções que o botão
    // está apertado
    if (event.button == 0)
        mouseDown = true;
    else if (event.button == 2)
        mouseRDown = true;
    // E seta a localização anterior do mouse,
    // para efeitos de comparação com a atual
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
}

// Lida com o botão do mouse sendo solto
function handleMouseUp(event) {
    // Reseta a flag
    if (event.button == 0)
        mouseDown = false;
    else if (event.button == 2)
        mouseRDown = false;
}


// Lida com o mouse se movendo
function handleMouseMove(event) {
    
    // Pega as novas coordenadas
    var newX = event.clientX;
    var newY = event.clientY;
    
    // Calcula a distância percorrida
    var deltaX = newX - lastMouseX;
    var deltaY = newY - lastMouseY;
    
    // Se estamos dando zoom
    if (mouseRDown || event.shiftKey) {
        var dy = 1 - deltaY/screenHeight;
        eyeAbs = vec3(eyeAbs[0] * dy, eyeAbs[1] * dy, eyeAbs[2] * dy);
        orthoZoom *= dy;
        if (projectionType == "Ortho") { updateOrthogonal(); }
        hasToUpdateLookAt = true;
    }
    // Se estamos girando a cena
    else if (mouseDown) {
        // Roda a cena de acordo
        var velocidade = 4;
        RotTrackball(vec2(velocidade * deltaX, velocidade * deltaY));
    }
    
    // Atualiza a posição "anterior" do mouse
    lastMouseX = newX
    lastMouseY = newY;
    
    // Pede pra um novo frame ser renderizado
//    requestAnimFrame(render);
}

// Callback próprio para lidar com as teclas
function handleKeys() {
    var ySpeed = 0;
    var xSpeed = 0;
    if (currentlyPressedKeys[37] == true) {
        // Left cursor key
        ySpeed -= 1;
    }
    if (currentlyPressedKeys[39] == true) {
        // Right cursor key
        ySpeed += 1;
    }
    if (currentlyPressedKeys[38] == true) {
        // Up cursor key
        xSpeed -= 1;
    }
    if (currentlyPressedKeys[40] == true) {
        // Down cursor key
        xSpeed += 1;
    }
    
    if (xSpeed != 0 || ySpeed != 0) {
        RotTrackball(vec2(ySpeed * 30, xSpeed * 30));
    }
    
}


// Callbacks do teclado
function handleKeyDown(event) {
    currentlyPressedKeys[event.keyCode] = true;
}

function handleKeyUp(event) {
    currentlyPressedKeys[event.keyCode] = false;
}


































/* RENDERING */
function render() {
    
    // Callback para executar as ações referentes ao teclado
    handleKeys();
    
    // Limpa a tela
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Move a peça
    runPlays();
    
    // Deixa a matriz de projeção pronta para ser aplicada
    finalizeRotation();
    

    
    
    // Para cada tipo de peça
    for (var i = 0; i < objects.length; i++) {
        // e para cada peça desse tipo
        for (var j = 0; j < objects[i].instances.length; j++) {
            // Se a peça ainda não foi removida do tabuleiro e não é um peao promovido
            if ((objects[i].instances[j].exists == true) && (objects[i].instances[j].promotion == -1)) {
                // Manda para o shader a matriz a ser aplicada (projeção x view x model)
                gl.uniformMatrix4fv(matrixLoc, false, flatten(times(projec, times(lookat, objects[i].instances[j].getMatrix()))));
                
                // Manda também a cor da peça, para podermos passar a cor certa para o fragment shader
                gl.uniform1f(teamLoc, objects[i].instances[j].color);
                
                // Desenha a peça atual
                gl.drawArrays( gl.TRIANGLES, objects[i].vertexStart, objects[i].vertexEnd - objects[i].vertexStart);
            }
        }
    }
    for (var i = 0; i < promoted.length; i++) {
        if (promoted[i].exists == true) {
            // Manda para o shader a matriz a ser aplicada (projeção x view x model)
            gl.uniformMatrix4fv(matrixLoc, false, flatten(times(projec, times(lookat, promoted[i].getMatrix()))));
            
            // Manda também a cor da peça, para podermos passar a cor certa para o fragment shader
            gl.uniform1f(teamLoc, promoted[i].color);
            
            // Desenha a peça atual
            gl.drawArrays( gl.TRIANGLES, objects[promoted[i].promotion].vertexStart, objects[promoted[i].promotion].vertexEnd - objects[promoted[i].promotion].vertexStart);
        }
    }
    
    
    // Renderiza o tabuleiro também
    // Manda para o shader a matriz a ser aplicada (projeção x view x model)
    gl.uniformMatrix4fv(matrixLoc, false, flatten(times(times(projec, lookat), tabMatrix)));
    
    // Manda também a cor da peça, para podermos passar a cor certa para o fragment shader
    gl.uniform1i(isBoardLoc, 1);
    
    // Desenha a peça atual
    gl.drawArrays( gl.TRIANGLES, 0, tabSize);

    gl.uniform1i(isBoardLoc, 0);
    
    
    requestAnimFrame(render);
}















