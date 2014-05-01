// ===================================================================================================
/* WebGL */
var canvas;
var gl;

// Tamanho da tela
var screenWidth;
var screenHeight;

// Tempo entre cada frame
var time;






// ===================================================================================================
/* Vértices para todas as peças */
var objStrings = [];        // Vetor de .obj's

var vertices = [];          // Vértices das peças
var verticesStart = 0;      // Inteiro para saber onde cada peça começa
var points = [];            // Vértices ordenados por face
var previousPointsSize = 0; // Tamanho acumulativo do vetor de vértices,
                            // para saber onde cada peça começa e acaba nele

// Contador para os vetores acima
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






// ===================================================================================================
/* Variáveis de view */
// Matriz para rodar o eye e o up
var rotation = mat4();

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
// Mouse
var mouseDown = false;      // Flag que indica se o botão esquerdo está apertado
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
var alphaLoc                // Quantidade de alpha a se usar na peça










// ===================================================================================================
/* Main */
window.onload = function init()
{
    /* Inicialização do WebGL */
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas, {premultupliedAlpha:false} );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    
    // Diz para a janela nos avisar quando o seu tamanho mudar
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Seta os valores do tamanho da tela
    screenWidth = canvas.width;
    screenHeight = canvas.height;
    
    
    // Lê os *.obj

    readObj('Pecas/torre.obj');
    readObj('Pecas/cavalo.obj');
    readObj('Pecas/bispo.obj');
    readObj('Pecas/rei.obj');
    readObj('Pecas/rainha.obj');
    readObj('Pecas/peao.obj');
    
}



function finishInit() {
    
    // Inicializa as informações das peças
    initObjects();
    
    // Lê os vértices e marca inícios e fins das peças
    for (var i = 0; i < objects.length; i++) {
        readVertices(objects[i]);
        readFaces(objects[i]);
    }
    
    // Liga os callbacks do mouse
    canvas.onmousedown = handleMouseDown;
    document.onmouseup = handleMouseUp;
    document.onmousemove = handleMouseMove;
    

    
    
    
    /* Configuração do WebGL */
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    
    
    
    // Enable hidden-surface removal
    gl.enable(gl.DEPTH_TEST);
    
    
    
    
    // Load shaders and initialize attribute buffers
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    
    
    var flat = flatten(points);
//    console.log("Flat: ", flat.length, points.length);
    
    // Create a buffer object, initialize it, and associate it with the
    // associated attribute variable in our vertex shader
    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flat, gl.DYNAMIC_DRAW );
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    
    
    
    
    // Pega as variáveis uniformes dos shaders
    matrixLoc = gl.getUniformLocation(program, "matrix");
    teamLoc = gl.getUniformLocation(program, "team");
    alphaLoc = gl.getUniformLocation(program, "alpha");

    
    
    
    // Designa funções para os itens da interface
    document.getElementById("Button1").onclick = changeProjection;
    document.getElementById("Button2").onclick = pausePlayPlayback;
    document.getElementById("Button3").onclick = resetPlays;
    
    
    // Inicializa a matriz lookat na posição inicial desejada (arbitrária)
    var radius = 1;
    var theta = 45;
    var phi = 45;
    eyeAbs = vec3(radius * Math.cos(theta), radius * Math.sin(theta) * Math.cos(phi), radius * Math.sin(theta) * Math.sin(phi));
    at = vec3(0.0, 0.0, 0.0);
    up = vec3(0.0, 1.0, 0.0);
    
    
    
    // Inicializa a matriz de projeção
    updatePerspective();
    
    
    
    // Inicializa o vetor de jogadas (nao deve ficar aqui)
    newPlay(5);
    newPlay(3);
    runPlays();
    
    
    // Começa o loop de execução
    render();
};


var readObjCallback = function(obj) {
    objStrings.push(obj);
    if (objStrings.length == 6)
        finishInit();
};

var readObj = function(url) {
    $.get(url, readObjCallback);
};


























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
    }
    
    // Configura a peça para saber onde é
    // o começo e o final dos seus vértices na lista
    piece.vertexStart = previousPointsSize;
    previousPointsSize = points.length;
    piece.vertexEnd = points.length;
    
    verticesStart = vertices.length;
}

// Inicializa as peças, com todas as informações necessárias
// TEMPORARIAMENTE ASSIM:
function initObjects() {
    var k = 0;
    
    var rooks = {string: objStrings[k], vertexStart: 0, vertexEnd: 0, instances: []};
    rooks.instances.push(piece(0, 0, 0));
    rooks.instances.push(piece(0, 7, 0));
    rooks.instances.push(piece(1, 0, 7));
    rooks.instances.push(piece(1, 7, 7));
    objects.push(rooks);
    k++;

    var knights = {string: objStrings[k], vertexStart: 0, vertexEnd: 0, instances: []};
    knights.instances.push(piece(0, 1, 0));
    knights.instances.push(piece(0, 6, 0));
    knights.instances.push(piece(1, 1, 7));
    knights.instances.push(piece(1, 6, 7));
    objects.push(knights);
    k++;
    
    var bishops = {string: objStrings[k], vertexStart: 0, vertexEnd: 0, instances: []};
    bishops.instances.push(piece(0, 2, 0));
    bishops.instances.push(piece(0, 5, 0));
    bishops.instances.push(piece(1, 2, 7));
    bishops.instances.push(piece(1, 5, 7));
    objects.push(bishops);
    k++;
    
    var kings = {string: objStrings[k], vertexStart: 0, vertexEnd: 0, instances: []};
    kings.instances.push(piece(0, 3, 0));
    kings.instances.push(piece(1, 4, 7));
    objects.push(kings);
    k++;
    
    var queens = {string: objStrings[k], vertexStart: 0, vertexEnd: 0, instances: []};
    queens.instances.push(piece(0, 4, 0));
    queens.instances.push(piece(1, 3, 7));
    objects.push(queens);
    k++;
    

    var pawns = {string: objStrings[k], vertexStart: 0, vertexEnd: 0, instances: []};
    for (var i = 0; i < 8; i++) {
        pawns.instances.push(piece(0, i, 1));
        pawns.instances.push(piece(1, i, 6));
    }
    objects.push(pawns);
    
    
//    var bishop = {string: bishopVertices, vertexStart: 0, vertexEnd: 0, instances: []};
//    
//    for (var i = 0; i < 8; i++) {
//        for (var j = 0; j < 8; j++) {
//            bishop.instances.push(piece(i%2, i, j));
//        }
//    }
//    
//    objects.push(bishop);
}


// Cria uma nova peça no time TEAM e na posição (X, Y) (medida em casas) do tabuleiro
function piece (team, x, y) {
    // Acha a direção para a qual a peça está olhando
    var direction;
    if (team) direction = -1.0;
    else direction = 1.0;
    
    // Tamanho padrão das peças
    var size = 0.2;
    
    // Cria a peça
    var piece = ({
                 exists: true,                     // Se a peça ainda existe
                 color: team,                       // O time da peça
                 alpha: 1.0,                        // O alpha da cor
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
                 getMatrix: getMatrix               // Devolve a 'matrix'
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
            p.alpha = 1.0;                      // E volta a aparecer, opaca
            p.position = vec3();                // Reseta: posição no mundo;
            p.scale = vec3( direction, 1.0, 1.0 );  // escala da peça;
            p.translation = mat4();             // matriz pessoal de translação;
            p.rotation = mat4();                // idem, para rotação;
            p.scaling = mat4();                 // idem, para escala;
            p.matrix = mat4();                  // junção das três acima;
            p.hasToUpdateMatrix = true;         // e precisamos recriar tudo.
            p.location = vec2(p.originalLocation[0], p.originalLocation[1]);    // Posição no tabuleiro em casas
            
            
            // Translada a peça para o lugar certo
            var loc = boardToWorld(p.location);
            p.setPosition(loc);
            // Escala a peça para o tamanho certo e muda ela de direção se necessário
            p.rescale(size, size, size);
        }
    }
}
































/*  Jogadas */
// Cria uma nova jogada e insere ela na fila
function newPlay (/*int*/ string) {
    var p = ({objectIndex: 0,                           // Índice do objeto da peça que vai se mover
             instanceIndex: 0,                          // Índice de instância dela
             piece: 0,
             bOrigin: objects[0].instances[0].location, // Origem no tabuleiro
             bDestination: vec2(string, string),        // Destino no tabuleiro
             wOrigin: objects[0].instances[0].position, // Origem no mundo
             wDestination: boardToWorld(vec2(string, string)),     // Destino no mundo
             direction: vec3(),                         // Vetor unitário de direção (no mundo)
             
             init:initPlay,                             // Inicializa as informações de acordo com
                                                        // a situação instantânea do tabuleiro
             
             deadObjectIndex: 0,
             deadInstanceIndex: 0,
             deadPiece: 0,
             });
    
    
    // Adiciona a nova jogada ao vetor de jogadas
    plays.push(p);
}

// Inicializa os valores da jogada que precisam ser pegos na hora
function initPlay() {
    // Pega a peça principal e a peça comida
    this.piece = objects[this.objectIndex].instances[this.instanceIndex];
    this.deadPiece = objects[this.deadObjectIndex].instances[this.deadInstanceIndex];
    
    
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

            else {                              // Se estamos no meio de uma jogada
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
                
                
                
                // Se estamos nos aproximando de uma peça a ser comida
                if (norm3(limit) < 1.0 && play.deadPiece != 0) {
                    play.deadPiece.alpha -= dt;
                }
                
                
                if (norm3(desloc) > norm3(limit)) {     // Se vamos andar (desloc) mais do que podemos (limit)
                    // Então só vamos andar até onde der
                    desloc = limit;
                    
                    // E vamos transladar exatamente para aquela posição
                    piece.setPosition(play.wDestination);
                    
                    // E essa jogada já acabou
                    isPlaying = 0;
                    
                }
                else {                      // Se ainda não acabou
                    // Translada a peça um pouco naquela direção
                    piece.translate(desloc[0], desloc[1], desloc[2]);
                }
                
                
                

                if (isPlaying == 0) {       // Se a jogada já acabou
                    // Vamos para a próxima jogada
                    playIndex++;
                    
                    // Remove a peça morta do tabuleiro, caso haja alguma
                    play.deadPiece.exists = false;
                }
                
            }
        }
    }
}










































/* AUXILIARES DE ÁLGEBRA LINEAR */
// Multiplicação simples e não muito rápida de duas matrizes 4x4
function times(mat1, mat2) {
    var mat = mat4();
    
    for(var i = 0; i < 4; i++) {
        for(var j = 0; j < 4; j++) {
            mat[i][j] = mat1[i][0]*mat2[0][j] + mat1[i][1]*mat2[1][j] + mat1[i][2]*mat2[2][j] + mat1[i][3]*mat2[3][j];
        }
    }
    
    return mat;
}

// Norma
// 3D
function norm3(p) {
    return Math.sqrt(p[0]*p[0] + p[1]*p[1] + p[2]*p[2]);
}
// 2D
function norm2(p) {
    return Math.sqrt(p[0]*p[0] + p[1]*p[1]);
}

// Produto vetorial 3D
function vcross(p, v) {
    return vec3(p[0] * v[1] - p[1] * v[0], - p[0] * v[2] + p[2] * v[0], p[1] * v[2] - p[2] * v[1]);
}

// Produto interno 3D
function vdot(p, v) {
    return p[0] * v[0] + p[1] * v[1] + p[2] * v[2];
}

// Radianos <=> graus
function radians (a) {
    return a * Math.PI / 180.0;
}
function degrees (a) {
    return a * 180.0 / Math.PI;
}

// Ângulo entre dois vetores 3D
// arccos(p.q/(|p|*|q|))
function angle(p, q) {
    var a = norm3(p);
    var b = norm3(q);
    var c = vdot(p, q);
    
    return Math.acos(c/(a*b));
}

// "Projeção" de um ponto (x,z) para um (x,y,z) na esfera unitária
// (Mousepad para Trackball)
function getY(p) {
    return Math.sqrt(1 - norm2(p));
}


// Multiplica uma matriz por um vetor
// 4D
function timesMV4(m, v) {
    var r = [0.0, 0.0, 0.0, 0.0];
    var x = 0;
    var k = 0;
    
    for (var i = 0; i < 4; i++) {
        for (var j = 0; j < 4; j++) {
            x += m[i][j] * v[j];
        }
        r[k] = x;
        k++;
        x = 0;
    }
    
    return r;
}

// 3D
function timesMV3(m, v) {
    var r = [0.0, 0.0, 0.0];
    var x = 0;
    var k = 0;
    
    for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 3; j++) {
            x += m[i][j] * v[j];
        }
        r[k] = x;
        k++;
        x = 0;
    }
    
    return r;
}


// Rotação de quatérnios
// Rodar o ponto q, t radianos ao redor de um vetor v
// q é 4D, v é 3D
function quatRot(q, v, t) {
    var c = Math.cos(t/2);
    var s = Math.sin(t/2);
    
    // p pega só as 3 primeiras coordenadas de q, que é 4D.
    var p = vec3(q[1], q[2], q[3]);
    var crossVP = vcross(p, v);
    
    var p1 = (c * c) * p;
    var p2 = (s * s) * vdot(p, v) * v;
    var p3 = 2 * c * s * crossVP;
    var p4 = -s * vcross(crossVP, v);
    
    return p1 + p2 + p3 + p4;
}


// Transforma uma coordenada do tabuleiro numa de mundo
function boardToWorld(loc) {
    return vec3(0.09 * (-3.5 + loc[0]), 0.0, 0.09 * (-3.5 + loc[1]));
}



// Dorme por 'milliseconds' segundos
function sleep(milliseconds) {
    var start = new Date().getTime();
    while (1) {
        if ((new Date().getTime() - start) > milliseconds){
            break;
        }
    }
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
    
    // Cria o p
    var p = vec3(0.0, 1.0, 0.0);
    
    // Acha o q na esfera
    v = vec2(v[0]/(screenWidth*2), v[1]/(screenHeight*2));
    var q = vec3(v[0], getY(v), v[1]);
    
    
    
    // Calcula o vetor pelo qual rodar e o ângulo de rotação sobre ele
    var c = vcross(p, q);
    
    var a = angle(p, q);
    
    
    // Calcula a norma do vetor resultante
    var n = norm3(c);
    
    // Se a norma for 0 é porque a diferença entre p e q é pequena
    // demais. Por isso, e para não dividirmos algo por 0, ignoramos
    // essa rotação.
    if (n != 0) {
        // Normaliza o vetor
        c = vec4(c[0]/n, c[1]/n, c[2]/n, 0.0);
        
        // Por causa do jeito como criamos p, este vetor está
        // no plano y = 0. Queremos rodá-lo até o eixo z. Para isso,
        // Consideramos o ângulo entre c e o eixo z.
        
        // A componente x do vetor vai ser o seno do ângulo
        // entre c e o eixo z. A componente z vai ser o cosseno.
        
        // Calcula a rotação em y
        var Ry  = [vec4(  c[2],   0.0,  c[0],   0.0),
                   vec4(   0.0,   1.0,   0.0,   0.0),
                   vec4( -c[0],   0.0,  c[2],   0.0),
                   vec4(   0.0,   0.0,   0.0,   1.0) ];
        
        // E a rotação de volta, com o ângulo negativo
        var Rmy = [vec4(  c[2],   0.0, -c[0],   0.0),
                   vec4(   0.0,   1.0,   0.0,   0.0),
                   vec4(  c[0],   0.0,  c[2],   0.0),
                   vec4(   0.0,   0.0,   0.0,   1.0) ];
        
        // Calcula a rotação em z
        // a é o ângulo entre p e q, o ângulo em que queremos
        // rodar cena
        var cos = Math.cos(a);
        var sin = Math.sin(a);
        
        var Rz = [vec4( cos, -sin, 0.0, 0.0),
                  vec4( sin,  cos, 0.0, 0.0),
                  vec4( 0.0,  0.0, 1.0, 0.0),
                  vec4( 0.0,  0.0, 0.0, 1.0) ];
        
        // Calcula a rotação final
        // R = R(-y)R(z)R(y)
        var m = times(Rmy, times(Rz, Ry));
    }
    // Se a norma for 0, vamos usar a matriz identidade criada na
    // declaração de m, que equivale a uma rotação por 0 graus.
    
    return m;
}

// Joga a matriz de rotação para os vetores do lookat
function finalizeRotation() {
    // Roda o eyeAbs e o up do LookAt
    if (hasToUpdateLookAt) {
        eyeAbs = timesMV3(rotation, eyeAbs);    // Roda o eye absoluto
        updateEye();                            // Calcula o eye baseado no eyeAbs e
                                                // no tamanho da janela
        up = timesMV3(rotation, up);            // Calcula o Up
        rotation = mat4();                      // Zera a rotação, que não é cumulativa
        
        lookat = lookAt(eye, at, up);           // Calcula o lookat
        
        hasToUpdateLookAt = false;
    }
}


// Atualiza o eye, com base no eye absoluto e no tamanho da janela
function updateEye() {
    // Redimensiona baseado na menor dimensão
    var minNovo = Math.min(canvas.clientHeight, canvas.clientWidth);
    minNovo = Math.max(minNovo, 1);                 // Para não dividir por 0
    
    // Pega a razão de zoom
    var ratio = 512/minNovo;
    
    // Aplica ao zoom absoluto
    eye = vec3(eyeAbs[0] * ratio, eyeAbs[1] * ratio, eyeAbs[2] * ratio);
    
    // Manda o lookat se atualizar
    hasToUpdateLookAt = true;
}































/* MATRIZES DE PROJEÇÃO */
// Cria e seta a matriz de perspectiva
function updatePerspective() {
    projec = perspective(70, canvas.width/canvas.height, 2.0, 0.0001);
}

// Idem, para a ortogonal
function updateOrthogonal() {
    projec = ortho(orthoZoom * -canvas.width/canvas.height, orthoZoom * canvas.width/canvas.height, orthoZoom * -1, orthoZoom * 1, orthoZoom * -4.1, orthoZoom * -0.1);
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
    mouseDown = true;
    // E seta a localização anterior do mouse,
    // para efeitos de comparação com a atual
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
}

// Lida com o botão do mouse sendo solto
function handleMouseUp(event) {
    // Reseta a flag
    mouseDown = false;
}

// Lida com o mouse se movendo
function handleMouseMove(event) {
    // Só vamos rodar se o botão estiver apertado
    if (!mouseDown) return;
    
    // Pega as novas coordenadas
    var newX = event.clientX;
    var newY = event.clientY;
    
    // Calcula a distância percorrida
    var deltaX = newX - lastMouseX;
    var deltaY = newY - lastMouseY;
    
    // Se estamos dando zoom
    if (event.shiftKey) {
        var dy = 1 - deltaY/screenHeight;
        eyeAbs = vec3(eyeAbs[0] * dy, eyeAbs[1] * dy, eyeAbs[2] * dy);
        orthoZoom *= dy;
        if (projectionType == "Ortho") { updateOrthogonal(); }
        hasToUpdateLookAt = true;
    }
    // Se estamos girando a cena
    else {
        // Roda a cena de acordo
        var velocidade = 4;
        rotation = RotTrackball(vec2(velocidade * deltaX, velocidade * deltaY));
        
        hasToUpdateLookAt = true;
    }
    
    // Atualiza a posição "anterior" do mouse
    lastMouseX = newX
    lastMouseY = newY;
    
    // Pede pra um novo frame ser renderizado
//    requestAnimFrame(render);
}





































/* RENDERING */
function render() {
    
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
            // Se a peça ainda não foi removida do tabuleiro
            if (objects[i].instances[j].exists == true) {
                // Manda para o shader a matriz a ser aplicada (projeção x view x model)
                gl.uniformMatrix4fv(matrixLoc, false, flatten(times(projec, times(lookat, objects[i].instances[j].getMatrix()))));
                
                // Manda também a cor da peça, para podermos passar a cor certa para o fragment shader
                gl.uniform1i(teamLoc, objects[i].instances[j].color);
                // E o alpha a ser usado
                gl.uniform1f(alphaLoc, objects[i].instances[j].alpha);
                
                // Desenha a peça atual
                gl.drawArrays( gl.TRIANGLES, objects[i].vertexStart, objects[i].vertexEnd - objects[i].vertexStart);
            }
        }
    }
    
    
//    console.log("HUE");
    requestAnimFrame(render);
}
















// COMO MUDAR O TAMANHO DA CAIXA
// - Acertar o zoom inicial, se o acima for possível