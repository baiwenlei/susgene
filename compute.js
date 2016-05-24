var jStat = require('jStat').jStat;
var profile = require('./profile');

var defaultParam_2 = {
    mat: jStat([
        [0.29,    -0.01],
        [-0.03,   0.49]
    ]),
    goal: [167, 11.2],
    generation: [6, 6]
};

var defaultParam_3 = {
    mat: jStat([
        [0.11,   -0.01,   -0.01],
        [0.33,   0.29,    -0.01],
        [0.03,   -0.03,   0.49]
    ]),
    goal: [10.7, 167, 11.2],
    generation: [10, 10, 10]
};

var defaultParam_4 = {
    mat: jStat([
        [0.11,   -0.01,   -0.01,   0.1],
        [0.33,   0.29,    -0.01,   -0.4],
        [0.03,   -0.03,   0.49,    0.04],
        [0.03,   -0.4,    0.14,    0.36]
    ]),
    goal: [10.7, 167, 11.2, 2.56],
    generation: [10, 10, 10, 10]
};

var defaltParams = [defaultParam_2, defaultParam_3, defaultParam_4];

function compute(profile, param) {
    var inputData = [];

    profile.colums.forEach((item, i) => {
        if(i == 0) return;

        if(!inputData[i-1]) inputData[i-1] = [];

        item.forEach(str => {
            inputData[i-1].push(parseFloat(str));
        });
    });

    var relWeight = computeRelWeight(inputData, param);

    var ebvIndex = inputData.length / 2;
    var index1 = inputData[0].map((item, j) => {
        return relWeight.reduce((sum, weight, i) => {
            return (sum + weight * inputData[ebvIndex+i][j]);
        }, 0);
    });

    // console.log(index1);

    var mean = jStat.mean(index1);
    var dev = jStat.stdev(index1);
    var index2 = index1.map((item, j) => {
        return 100 + 25 * (index1[j] - mean) / dev;
    });
    // console.log(index2);

    return [index1.map(item => {return item.toFixed(2)}), index2.map(item => {return item.toFixed(2)})];
}

function computeRelWeight(inputData, param) {
    var devs = inputData.map(item => {
        return jStat.stdev(item);
    });

    // check if inputData valid

    param = param || defaltParams[inputData.length/2 - 2];

    var matP = computeMatP(devs, param.mat);
    var matG = computeMatG(devs, param.mat);
    var invG = jStat.inv(matG);
    // console.log("invG", invG);
    var mat = jStat.multiply(matP, invG);
    console.log("mat: ", mat);

    var avr = inputData.map(item => {
        return jStat.mean(item);
    });

    console.log("avr: ", avr);
    var rx = computeRx(avr, param);
    console.log("Rx: ", rx);
    var vec = jStat.multiply(rx, invG);
    console.log("mat * rx", vec);
    var relWeight = jStat.multiply(vec, mat);
    console.log("relative weight1: ", relWeight);

    // debugger;
    return relWeight[0];
}

function createMat(devs) {
    var size = devs.length/2;
    var mat = new Array(size);
    for(var i=0; i<size; i++) {
        mat[i] = new Array(size);
    }

    return jStat(mat);
}

function computeMatP(devs, mat) {
    var matP = createMat(devs);
    for(var i=0; i<matP.length; i++) {
        matP[i][i] = Math.pow(devs[i], 2);

        for (var j=i+1; j<matP.length; ++j) {
            matP[i][j] = mat[i][j] * devs[i] * devs[j];
            matP[j][i] = matP[i][j];
        }
    }

    console.log(matP);

    return matP;
}

function computeMatG(devs, mat) {
    var matG = createMat(devs);
    for(var i=0; i<matG.length; i++) {
        matG[i][i] = Math.pow(devs[i], 2) * mat[i][i];

        for (var j=i+1; j<matG.length; ++j) {
            matG[i][j] = mat[j][i] * Math.sqrt(mat[i][i]) *  Math.sqrt(mat[j][j]) * devs[i] * devs[j];
            matG[j][i] = matG[i][j];
        }
    }

    console.log("matG: ", matG);

    return matG;
}

function computeRx(avr, param) {
    var rx = new Array(param.goal.length);

    param.goal.forEach((dst, i) => {
        // console.log(`dst: ${dst} i: ${i} avr[i]: ${avr[i]} generation: ${param.generation[i]}`);
        rx[i] = (dst - avr[i]) / param.generation[i];
    });

    return jStat(rx);
}

module.exports = compute;
