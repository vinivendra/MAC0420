// ===================================================================================================
/* WebGL */
var canvas;
var gl;


// ===================================================================================================
/* Matrizes */
var projec = mat4();            // Matriz de projeção
var lookat;


// ===================================================================================================
/* Input */
var currentlyPressedKeys = [];
var lastMouseX = 0;
var lastMouseY = 0;
var mouseDown = false;
var mouseRDown = false;




// ===================================================================================================
/* Objetos */
var vertices = [];
var points = [];
var colors = [];

var objects = [];

var objStrings = [];
var verticesStart = 0;
var previousPointsSize = 0;




// ===================================================================================================
/* Hitboxes */
var hitboxes = [];




// ===================================================================================================
/* Tabuleiro */
var boardNormal = vec4(0.0, 0.0, 1.0, 0.0);



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
    
    
    readObj('sphere.obj');
}

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
    if (objStrings.length < 1) {
        readObj(objNames[i]);
        i++;
    }
    // Se já acabou, pode fazer o resto
    else
        finishInit();
};

function finishInit() {
    i = 0;
    
    // Liga os callbacks do mouse
    canvas.onmousedown = handleMouseDown;
    document.onmouseup = handleMouseUp;
    document.onmousemove = handleMouseMove;
    
    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;
    
    
    
    readVertices(objStrings[0]);
    var ballVertexRange = readFaces(objStrings[0]);
    var ball = newObjectBall(ballVertexRange, vec4(0.0, 0.0, 0.0, 1.0), 0.1);
    
    objects.push(ball);
    
    
    
    var hitbox = [vec4(-1.0, -0.5, -1.0, 1.0),      // Retângulo
                  vec4( 1.0, -0.6, -1.0, 1.0),
                  vec4( 1.0, -0.6,  1.0, 1.0),
                  vec4(-1.0, -0.5,  1.0, 1.0),
                  
                  vec4( 0.0,  1.0,  0.0, 0.0),      // Normal (unitária)
                  
                  -0.2 ];                           // Aumento de energia
    
    hitbox[4] = vcross(minus(hitbox[1], hitbox[0]), minus(hitbox[3], hitbox[0]));
    hitbox[4] = normalizev(hitbox[4]);
    
    hitboxes.push(hitbox);
    
    
    var hitbox2 = [vec4(-1.0, -0.4, -1.0, 1.0),      // Retângulo
                   vec4( 1.0, -0.3, -1.0, 1.0),
                   vec4( 1.0, -0.3,  1.0, 1.0),
                   vec4(-1.0, -0.4,  1.0, 1.0),
                   
                   vec4( 0.0,  1.0,  0.0, 0.0),      // Normal (unitária)
                   
                   -0.2 ];                           // Aumento de energia
    
    hitbox2[4] = vcross(minus(hitbox2[1], hitbox2[0]), minus(hitbox2[3], hitbox2[0]));
    hitbox2[4] = normalizev(hitbox2[4]);
    
    hitboxes.push(hitbox2);
    
    
    
    /* Configuração do WebGL */
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.1, 0.1, 0.1, 1.0 );
    
    
    
    
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
    
    
    
    // Inicializa a matriz lookat na posição inicial desejada (arbitrária)
    eye = vec3(0.0, 0.0, 1.0);
    at = vec3(0.0, 0.0, 0.0);
    up = vec3(0.0, 1.0, 0.0);
    lookat = lookAt(eye, at, up);
    
    
    
    // Inicializa a matriz de projeção
    updatePerspective();
    
    
    objects[0].updateModelViewMatrix();
    
    render();
};
























/* INICIALIZAÇÃO DE OBJETOS */
// Lê os vértices de cada peça e os armazena no vetor
function readVertices(string) {
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
function readFaces(string) {
    // Pula todas as linhas "vn ", que não vai ser usadas por enquanto
    while (string.charAt(i) == 'v') {
        while (string.charAt(i) != '\n') i++;
        i++;
    }
    
    /* Pula mais duas linhas:
     
     usemtl wire_255255255
     s off
     */
    while (string.charAt(i) != '\n') i++;
    i++;
    while (string.charAt(i) != '\n') i++;
    i++;
    
    // Para cada face
    while (string.charAt(i) == 'f') {
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
        for (var k = 0; k < 3; k++) {
            var c = vertices[verticesStart + number[k]][1];
            var col = vec4(c, c, c, 1.0);
            colors.push(col);
        }
        
    }
    
    // Configura a peça para saber onde é
    // o começo e o final dos seus vértices na lista
    var vertexStart = previousPointsSize;
    previousPointsSize = points.length;
    var vertexEnd = points.length;
    
    verticesStart = vertices.length;
    
    return vec2(vertexStart, vertexEnd);
}


/* Cria um novo objeto de acordo com os parâmetros passados */

function newObject( vertexRange, position, size, theta, phi, psi ) {
    
    if (! position) position = vec4(0.0, 0.0, 0.0, 1.0);
    if (! size    )     size = 1.0;
    if (! theta   )    theta = 0.0;
    if (! phi     )      phi = 0.0;
    if (! psi     )      psi = 0.0;
    
    
    
    var obj = ({
               // Intervalo correspondente aos vértices do objeto
               vertexStart: vertexRange[0],
               vertexEnd: vertexRange[1],
               
               //==============================================
               
               // Posição do objeto no mundo e sua matriz de translação
               position: position,
               translationMatrix: translate(position),
               
               // Matriz de rotação
               rotationMatrix: rotateInXYZ(theta, phi, psi),
               
               // Matriz de escala
               scaleMatrix: scale(size),
               
               // Matriz produto das três anteriores
               modelViewMatrix: null,
               
               // Método de atualização da modelViewMatrix e flag para
               //  evitar de aualizá-la desnecessariamente
               updateModelViewMatrix: updateModelViewMatrix,
               hasToUpdateMatrix: true,
               
               //==============================================
               
               // Métodos de transformação geométrica dos objetos
               translate: translateInc,
               rotate: rotateInXYZInc,
               scale: scaleInc,
               deform: deformInc,
               
               });
    
    return obj;
}




/* Cria uma nova bola */
function newObjectBall ( vertexRange, position, size, theta, phi, psi ) {
    
    if (! position) position = vec4(0.0, 0.0, 0.0, 1.0);
    if (! size    )     size = 1.0;
    if (! theta   )    theta = 0.0;
    if (! phi     )      phi = 0.0;
    if (! psi     )      psi = 0.0;
    
    
    
    var obj = ({
               // O começo é idêntico ao método de contrução
               //  de objetos genéricos acima
               vertexStart: vertexRange[0],
               vertexEnd: vertexRange[1],
               
               //==============================================
               
               position: position,
               translationMatrix: translate(position),
               
               rotationMatrix: rotateInXYZ(theta, phi, psi),
               
               scaleMatrix: scale(size),
               
               modelViewMatrix: null,
               
               updateModelViewMatrix: updateModelViewMatrix,
               hasToUpdateMatrix: true,
               
               //==============================================
               
               translate: translateObj,
               rotate: rotateObj,
               scale: scaleObj,
               deform: deformObj,
               
               //==============================================
               
               // Variáveis e métodos da física da bola
               
               // Tempo desde a última atualização
               time: (new Date()).getTime(),
               // Massa sa bola
               mass: 1.0,
               // Velocidade atual instantânea
               velocity: vec4(-0.0, 0.0, 0.0, 0.0),
               // Acumulador de forças
               forces: gravity(),
               // Aplica as forças, move a bola e reseta o acumulador
               applyForces: applyForces,
               
               });
    
    return obj;
}



/* Funções de transformação geométrica dos objetos */

// Translação
function translateObj(vector) {
    // Atualiza a posição
    this.position = plus(this.position, vector);
    
    this.hasToUpdateMatrix = true;
    
    // Atualiza a matriz de translação
    this.translationMatrix = translateInc(vector, this.translationMatrix);
}

// Rotação
function rotateObj(theta, phi, psi) {
    this.hasToUpdateMatrix = true;
    
    this.rotationMatrix = rotateInXYZInc(theta, phi, psi, this.rotationMatrix);
}

// Escala
function scaleObj(a) {
    this.hasToUpdateMatrix = true;
    
    this.scaleMatrix = scaleInc(a, this.scaleMatrix);
}

// Deformação
function deformObj(v) {
    this.hasToUpdateMatrix = true;
    
    this.scaleMatrix = deformInc(v, this.scaleMatrix);
}



// Aplica as forças acumuladas a um objeto
function applyForces () {
    // Pega a aceleração
    var accel = mult(1.0/this.mass, this.forces);           // F = ma -> a = F/m
    
    // Zera o acumulador de forças
    this.forces = gravity();
    
    // Acha o intervalo de tempo
    var time = (new Date()).getTime() - this.time;
    this.time += time;
    time /= 1000;
    
    // Calcula a nova velocidadew
    this.velocity = plus(this.velocity, mult(time, accel)); // v = v_0 + at
    
    // Se não estamos parados
    if (normS(this.velocity) != 0) {
        
        // Calcula o limite de deslocamento
        var limit = limitForMovement(this);         // "O quanto a bola pode andar"
        
        
        // Se não vai bater em ninguem, é só andar
        if (limit == null) {
            this.translate(this.velocity);
        }
        
        // Se vai bater em alguém, tratamos a colisão
        else {
            // Pega as informações da colisão
            var normalVector = limit[1];
            var energyCoefficient = limit[2];
            limit = limit[0];
            
            
            // Calcula o deslocamento
            var proj = projection(this.velocity, normalizev(limit));
            
            var v1 = normalizev(this.velocity);
            
            var sizeV1 = normS(this.velocity)*normS(limit)/normS(proj);
            sizeV1 = Math.sqrt(sizeV1);
            v1 = mult(0.99 * sizeV1, v1);
            
            
            
            // Anda até o obstáculo
            this.translate(v1);
            
            
            
            // Calcula a direção de reflexão
            var p = projection(this.velocity, mult(-1, normalizev(limit)));
            
            var reflection = minus(this.velocity, mult(2, p));
            reflection = normalizev(reflection);
            
            
            // Calcula a velocidade nova
            reflection = mult(norm(this.velocity), reflection);
            var refProj = projection(reflection, normalVector);
            
            if (normS(this.velocity) <= 0.00001) {
                energyCoefficient = 0.0015;
                refProj = normalizev(refProj);
            }
            
            reflection = plus(reflection, mult(energyCoefficient, refProj));
            
            this.velocity = reflection;
        }
        
        
        
    }
    else {
        console.log("Parei");
    }
    
    // SET THE BALL'S ROTATION HERE... HEEEEEEREEEE
}




// Retorna o deslocamento máximo que a bola pode ter com relação a uma superfície
function limitForMovement(ball) {
    var limit;
    
    var normSVelocity = normS(ball.velocity);
    
    
    // Vetor que vai guardar apenas os obstáculos próximos
    var possibles = [];
    
    // Variável que guarda as informações da hitbox mais próxima
    var result = null;
    
    
    // Acha os obstáculos próximos
    for (var i = 0; i < hitboxes.length; i++) {
        
        var hitbox = hitboxes[i];
        var hitboxNormal = hitbox[4];
        
        // Pega a posição relativa da bola
        var ballToHitbox = minus(ball.position, hitbox[0]);
        // E a distância da bola ao obstáculo
        var distance = projection(ballToHitbox, hitboxNormal);
        
        // Se vamos andar mais do que a distância permitida
        if (normS(distance) < normSVelocity && normS(distance) > 0) {
            // Coloca este obstáculo no vetor
            possibles.push(i);
        }
    }
    
    
    
    // Depois da filtração inicial, vamos ver se a bola vai atravessar uma hitbox ou não
    for (var i = 0; i < possibles.length; i++) {
        // Peha as informações da hitbox atual
        var hitbox = hitboxes[possibles[i]];
        var hitboxRectangle = [hitbox[0], hitbox[1], hitbox[2], hitbox[3]];
        var hitboxNormal = hitbox[4];
        var hitboxEnergy = hitbox[5];
        
        
        // Pega um vetor que levaria a bola à hitbox
        var ballToHitbox = minus(ball.position, hitboxRectangle[0]);

        // Se estamos do lado certo da hitbox
        if (vdot(ballToHitbox, hitboxNormal) > 0) {
            // O quanto a bola passaria da hitbox (se atravessasse):
            var movementRemainder = plus(ball.position    , ball.velocity);
            movementRemainder =    minus(movementRemainder, hitboxRectangle[0]);
            
            
            // Se vamos passar do plano que contém a hitbox
            if (vdot(movementRemainder, hitboxNormal) < 0) {
                
                // Projeta os dois vetores na direção normal ao plano
                var ballToHitbox =      projection(ballToHitbox     , hitboxNormal);
                var movementRemainder = projection(movementRemainder, hitboxNormal);
                
                // Pega o tamanho de cada um
                var toHitboxNormal = norm(ballToHitbox);
                var remainderNormal = norm(movementRemainder);
                
                // Acha a proporção (o tamanho do vetor velocidade que está antes da hitbox,
                // proporcional ao seu tamanho todo).
                var ratio = toHitboxNormal/(toHitboxNormal+remainderNormal);
                
                // A partir disso, semelhança de triângulos nos dá o ponto de intersecção do plano,
                // com possíveis erros desprezíveis de float.
                var intersectionPoint = plus(ball.position, mult(ratio, ball.velocity));
                
                // Pega um vetor que leva de algum canto da hitbox ao ponto de intersecção
                var intersection = minus(intersectionPoint, hitboxRectangle[0]);
                
                
                // Pega o primeiro lado do retângulo
                var d1 = minus(hitboxRectangle[1], hitboxRectangle[0]);
                // O vetor de intersecção tem que fazer no máximo 90 graus com o 1o lado
                if (vdot(d1, intersection) > 0) {
                    
                    // Se fizer, testamos o equivalente para o segundo lado
                    var d2 = minus(hitboxRectangle[3], hitboxRectangle[0]);
                    if (vdot (d2, intersection) > 0)  {
                        
                        // E para o terceiro
                        var d3 = minus(hitboxRectangle[1], hitboxRectangle[2]);
                        if (vdot(d3, intersection) < 0) {
                            
                            // E para o quarto
                            var d4 = minus(hitboxRectangle[3], hitboxRectangle[2]);
                            if (vdot (d4, intersection) < 0)  {
                                
                                // Se tudo isso deu certo, estamos dentro do retângulo
                                
                                // Vamos ver se a hitbox que achamos está mais próxima de alguma outra ou não
                                if (result != null) {
                                    
                                    // Pega a distância entre a bola e a hitbox (no sentido da velocidade)
                                    var distance = minus(ball.position, intersectionPoint);
                                    var n;
                                    
                                    // Se essa está mais perto
                                    if ((n = normS(distance)) < result[2]) {
                                        
                                        // Pegamos a distância entre a bola e a hitbox (no sentido da normal da hitbox)
                                        limit = projection(ballToHitbox, hitboxNormal);
                                        limit = mult(-1.0, limit);
                                        
                                        // Coloca as informações dessa colisão no resultado
                                        result = [possibles[i], limit, n];
                                    }
                                }
                                // Se esse é o primeiro resultado achado
                                else {
                                    // Pegamos a distância entre a bola e a hitbox (no sentido da normal da hitbox)
                                    limit = projection(ballToHitbox, hitboxNormal);
                                    limit = mult(-1.0, limit);
                                    
                                    // Coloca as informações dessa colisão no resultado
                                    result = [possibles[i], limit, normS(minus(ball.position, intersectionPoint))];
                                }
                                

                            }
                        }
                    }
                }
                
            }
        }
    }
    
    
    // Se não vamos bater em ninguém, não há o que retornar
    if (result == null) {
        return null;
    }

    // Caso contrário, organizamos as informações e retornamos
    return [result[1], hitboxes[result[0]][4], hitboxes[result[0]][5]];
}


// Retorna a "força da gravidade", ajustada
//  de acordo com a inclinação da mesa
function gravity() {
    return vec4(0.0, -0.03, 0.0, 0.0);
}




// Multiplica as matrizes de um objeto (se necessário) para obter a matriz final de model view
function updateModelViewMatrix() {
    if (this.hasToUpdateMatrix) {
        this.modelViewMatrix = times3(this.translationMatrix, this.rotationMatrix, this.scaleMatrix);
        this.hasToUpdateMatrix = false;
    }
}

















/* MATRIZES DE PROJEÇÃO */
// Cria e seta a matriz de perspectiva
function updatePerspective() {
    //    projec = perspective(60, canvas.width/canvas.height, 2.0, 0.0001);
    var orthoZoom = 0.5;
    projec = ortho(orthoZoom  * -canvas.width/canvas.height, orthoZoom  * canvas.width/canvas.height, orthoZoom  * -1, orthoZoom  * 1, orthoZoom  * -4.1, orthoZoom  * -0.1);
}




























/* Redimensionamento */
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
    updatePerspective();
}











/* CALLBACKS DE INPUT */
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
    
    
    /* DO STUFF */
    
    // Atualiza a posição "anterior" do mouse
    lastMouseX = newX
    lastMouseY = newY;
    
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
        /* Do other stuff */
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
    
    
    // Para cada bola
    for (i = 0; i < objects.length; i++) {
        objects[i].applyForces();
        //        console.log(objects[i].forces, objects[i].position, objects[i].velocity);
    }
    
    
    for (i = 0; i < objects.length; i++) {
        var obj = objects[i];
        
        // Atualiza as informações do objeto
        obj.updateModelViewMatrix();
        
        // Manda para o shader a matriz a ser aplicada (projeção x view x model)
        gl.uniformMatrix4fv(matrixLoc, false, flatten(times(projec, times(lookat, obj.modelViewMatrix))));
        
        // Desenha o objeto atual
        gl.drawArrays( gl.TRIANGLES, 0, points.length);
    }
    
    
    
    
    
    requestAnimFrame(render);
}