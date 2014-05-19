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

function times3(a, b, c) {
    return times( times(a, b), c);
}

function times4(a, b, c, d) {
    return times( times3(a, b, c), d);
}

function times4(a, b, c, d, e) {
    return times( times4(a, b, c, d), e);
}

// Norma
// Default
function norm(p) {
    return Math.sqrt(p[0]*p[0] + p[1]*p[1] + p[2]*p[2]);
}
// Squared
function normS(p) {
    return p[0]*p[0] + p[1]*p[1] + p[2]*p[2];
}
// 3D
function norm3(p) {
    return Math.sqrt(p[0]*p[0] + p[1]*p[1] + p[2]*p[2]);
}
// 2D
function norm2(p) {
    return Math.sqrt(p[0]*p[0] + p[1]*p[1]);
}
// Normalization
function normalizev(p) {
    var n = norm(p);
    if (n == 0) return zeroVector();
    return vec4(p[0]/n, p[1]/n, p[2]/n, 0.0);
}

// Produto vetorial 3D
function vcross(p, v) {
    return vec3(p[1] * v[2] - p[2] * v[1], - p[2] * v[0] + p[0] * v[2], p[0] * v[1] - p[1] * v[0]);
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
    var a = norm(p);
    var b = norm(q);
    var c = vdot(p, q);
    
    return Math.acos(c/(a*b));
}

// Cosseno do ângulo entre dois vetores
// arccos(p.q/(|p|*|q|))
function cosAngle(p, q) {
    var a = norm(p);
    var b = norm(q);
    
    if (a || b) {       // Se estiver tudo certo
        var c = vdot(p, q);
        return c/(a*b);
    }
    else {              // Se um dos dois for 0
        return 0;
    }
}

// Projeção de um vetor v na direção de um vetor u
// p = <v, u> x (u/|u|)
function projection(v, u) {
    
    var w = normalizev(u);

    var d = vdot(v, w);
    
    return mult(d, w);
}




// "Projeção" de um ponto (x,y) para um (x,y,z) na esfera unitária
// (Mousepad para Trackball)
function getZ(p) {
    return Math.sqrt(1 - 2(p));
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
    var p = vec3(q[0], q[1], q[2]);
    var crossVP = vcross(v, p);
    
    //    var p1 = (c * c) * p;
    var p1 = mult3(c * c, p);
    //    var p2 = (s * s) * vdot(p, v) * v;
    var p2 = mult3(s*s*vdot(p,v), v);
    //    var p3 = 2 * c * s * crossVP;
    var p3 = mult3(2*c*s, crossVP);
    //    var p4 = -s * vcross(crossVP, v);
    var p4 = mult3(-s, vcross(crossVP, v));
    
    //    return p1 + p2 + p3 + p4;
    var result = add3( add3( add3(p1, p2), p3), p4);
    return result;
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






/* Manipulação de vetores e pontos */
function plus(a, b) {
    return vec4(a[0] + b[0], a[1] + b[1], a[2] + b[2], a[3]);
}

function minus(a, b) {
    return vec4(a[0] - b[0], a[1] - b[1], a[2] - b[2], a[3]);
}

function mult(a, v) {
    return vec4(a * v[0], a * v[1], a * v[2], v[3]);
}









// Criação de pontos e vetores
function vectorize (a) {
    return vec4(a[0], a[1], a[2], 0.0);
}

function pointize (a) {
    return vec4(a[0], a[1], a[2], 1.0);
}

function zeroVector () {
    return vec4(0.0, 0.0, 0.0, 0.0);
}

function zeroPoint () {
    return vec4(0.0, 0.0, 0.0, 1.0);
}






/* Matrizes de rotação */

function rotateInX (theta) {
    var cos = Math.cos(theta);
    var sin = Math.sin(theta);
    return [
            vec4(  1.0,  0.0,  0.0, 0.0),
            vec4(  0.0,  cos, -sin, 0.0),
            vec4(  0.0,  sin,  cos, 0.0),
            vec4(  0.0,  0.0,  0.0, 1.0 ) ];
}

function rotateInY (phi) {
    var cos = Math.cos(phi);
    var sin = Math.sin(phi);
    return [
            vec4(  cos,  0.0, -sin, 0.0),
            vec4(  0.0,  1.0,  0.0, 0.0),
            vec4(  sin,  0.0,  cos, 0.0),
            vec4(  0.0,  0.0,  0.0, 1.0 ) ];
}

function rotateInZ (psi) {
    var cos = Math.cos(psi);
    var sin = Math.sin(psi);
    return [
            vec4(  cos, -sin,  0.0, 0.0),
            vec4(  sin,  cos,  0.0, 0.0),
            vec4(  0.0,  0.0,  1.0, 0.0),
            vec4(  0.0,  0.0,  0.0, 1.0 ) ];
    
}

function rotateInXYZ (theta, phi, psi) {
    return times3(rotateInX(theta), rotateInY(phi), rotateInZ(psi));
}

function rotateInXYZInc (theta, phi, psi, oldMatrix) {
    return times4(rotateInX(theta), rotateInY(phi), rotateInZ(psi), oldMatrix);
}

/* Matrizes de translação */

function translate (vector) {
    return [
            vec4(  1.0,  0.0,  0.0,  vector[0] ),
            vec4(  0.0,  1.0,  0.0,  vector[1] ),
            vec4(  0.0,  0.0,  1.0,  vector[2] ),
            vec4(  0.0,  0.0,  0.0,        1.0 ) ];
}

function setPositionFromTo (from, to) {
    var vector = minus(to, from);
    
    translate(vector);
}

function translateInc (vector, oldMatrix) {
    return times(translate(vector), oldMatrix);
}


/* Matrizes de escala */

function scale (a) {
    return [
            vec4(    a,  0.0,  0.0,  0.0 ),
            vec4(  0.0,    a,  0.0,  0.0 ),
            vec4(  0.0,  0.0,    a,  0.0 ),
            vec4(  0.0,  0.0,  0.0,  1.0 ) ];
}

function deform (v) {
    return [
            vec4( v[0],  0.0,  0.0,  0.0 ),
            vec4(  0.0, v[1],  0.0,  0.0 ),
            vec4(  0.0,  0.0, v[2],  0.0 ),
            vec4(  0.0,  0.0,  0.0,  1.0 ) ];
}

function scaleInc (a, oldMatrix) {
    return times(scale(a), oldMatrix);
}

function deformInc (v, oldMatrix) {
    return times(deform(v), oldMatrix);
}