var jStat = require('jStat').jStat;
var profile = require('./profile');

var defaultParam = {
    mat: jStat([[0.11, -0.01, -0.01], [0.33, 0.29, -0.01], [0.03, -0.03, 0.49]]),
    goal: {
        childCount: 10.7,
        days: 167,
        bb: 11.2
    },
    generation: {
        childCount: 10,
        days: 10,
        bb: 10
    }
};

function process(profiles, param) {
    var weightTable = computeRelWeight(profiles, param);
    profiles.forEach(profile => {
        profile.index1 = (weightTable[0][0] * profile.ccEbv
                       + weightTable[0][1] * profile.daysEbv
                       + weightTable[0][2] * profile.fixEbv);

        console.log(profile.index1);
    });

    var index1Table = profiles.map(profile => {return profile.index1;});
    var mean = jStat.mean(index1Table);
    var stdev = jStat.stdev(index1Table);
    profiles.forEach(profile => {
        profile.index2 = (100 + 25 * (profile.index1-mean)/stdev);
        console.log(profile.index2);
    });
}

function computeRelWeight(profiles, param) {
    var childCounts = profiles.map(profile => {return profile.childCount});
    var days = profiles.map(profile => {return profile.days});
    var fixedBBs = profiles.map(profile => {return profile.fixedBB});
    var ccEbvs = profiles.map(profile => {return profile.ccEbv});
    var daysEbvs = profiles.map(profile => {return profile.daysEbv});
    var fixEbvs = profiles.map(profile => {return profile.fixEbv});

    // console.log(jStat.stdev(childCounts));
    // console.log(jStat.stdev(days));
    // console.log(jStat.stdev(fixedBBs));
    // console.log(jStat.stdev(ccEbvs));
    // console.log(jStat.stdev(daysEbvs));
    // console.log(jStat.stdev(fixEbvs));

    var dev = {
        childCount: jStat.stdev(childCounts),
        day: jStat.stdev(days),
        fixedBB: jStat.stdev(fixedBBs),
        ccEbv: jStat.stdev(ccEbvs),
        dayEbv: jStat.stdev(daysEbvs),
        fixEbv: jStat.stdev(fixEbvs)
    };

    param = param || defaultParam;

    var matP = computeMatP(dev, param.mat);
    var matG = computeMatG(dev, param.mat);
    var invG = jStat.inv(matG);
    // console.log("invG", invG);
    var mat = jStat.multiply(matP, invG);
    console.log("mat: ", mat);

    var avr = {
        childCount: jStat.mean(childCounts),
        day: jStat.mean(days),
        fixedBB: jStat.mean(fixedBBs)
    };
    var rx = computeRx(avr, param);
    // console.log("Rx: ", rx);
    var vec = jStat.multiply(rx, invG);
    console.log("mat * rx", vec);
    var relWeight = jStat.multiply(vec, mat);
    console.log("relative weight1: ", relWeight);

    // debugger;
    return relWeight;
}

function computeMatP(dev, mat) {
    var m00 = Math.pow(dev.childCount, 2);
    var m01 = mat[0][1] * dev.childCount * dev.day;
    var m02 = mat[0][2] * dev.childCount * dev.fixedBB;
    var m10 = m01;
    var m11 = Math.pow(dev.day, 2);
    var m12 = mat[1][2] * dev.day * dev.fixedBB;
    var m20 = m02;
    var m21 = m12;
    var m22 = Math.pow(dev.fixedBB, 2);

    var matP = jStat([[m00, m01, m02], [m10, m11, m12], [m20, m21, m22]]);
    console.log("matP: ", matP);

    return matP;
}

function computeMatG(dev, mat) {
    var m00 = Math.pow(dev.childCount, 2) * mat[0][0];
    var m01 = mat[1][0] * Math.sqrt(mat[0][0]) * Math.sqrt(mat[1][1]) * dev.childCount * dev.day;
    var m02 = mat[2][0] * Math.sqrt(mat[0][0]) * Math.sqrt(mat[2][2]) * dev.childCount * dev.fixedBB;
    var m10 = m01;
    var m11 = Math.pow(dev.day, 2) * mat[1][1];
    var m12 = mat[2][1] * Math.sqrt(mat[1][1]) * Math.sqrt(mat[2][2]) * dev.day * dev.fixedBB;
    var m20 = m02;
    var m21 = m12;
    var m22 = Math.pow(dev.fixedBB, 2) * mat[2][2];

    var matG = jStat([[m00, m01, m02], [m10, m11, m12], [m20, m21, m22]]);
    console.log("matG: ", matG);

    return matG;
}

function computeRx(avr, param) {
    var goal = param.goal, generation = param.generation;
    var r0 = (goal.childCount - avr.childCount) / generation.childCount;
    var r1 = (goal.days - avr.day) / generation.days;
    var r2 = (goal.bb - avr.fixedBB) /generation.bb;

    return jStat([r0, r1, r2]);
}

module.exports = process;
