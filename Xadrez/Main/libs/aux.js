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
    var a = norm3(p);
    var b = norm3(q);
    var c = vdot(p, q);
    
    return Math.acos(c/(a*b));
}

// "Projeção" de um ponto (x,y) para um (x,y,z) na esfera unitária
// (Mousepad para Trackball)
function getZ(p) {
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


// Multiplicação de escalar por vetor
function mult3(a, v) {
    return vec3(a*v[0], a*v[1], a*v[2]);
}

// Adição de vetores
function add3(w, v) {
    return vec3(w[0] + v[0], w[1] + v[1], w[2] + v[2]);
}



// Transforma uma coordenada do tabuleiro numa de mundo
function boardToWorld(loc) {
    return vec3(0.09 * (-3.5 + loc[0]), 0.0, 0.09 * (+3.5 - loc[1]));
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