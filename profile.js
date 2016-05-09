//
//
"use strict";

var schema = ["childCount", "days", "fixedBB", "ccEbv", "daysEbv", "fixEbv"];

class PigProfile {
    constructor() {
        this.name = "temp";
        schema.forEach(item => this[item]=0);
    }

    static createFromString(str) {
        if(!str) {
            return null;
        }

        var fields = str.split(/[\s,|]+/);
        if(!fields) {
            return null;
        }

        var profile = new PigProfile();
        profile.name = fields.shift();

        for(var i=0; i<schema.length && i<fields.length; ++i) {
            var number = Number.parseFloat(fields[i]);
            if(isNaN(number)) {
                return null;
            }
            profile[schema[i]] = Number.parseFloat(fields[i]);
        }
        return profile;
        // console.log(profile);
    }

    toArray() {
        var array = [this.name];
        schema.forEach(popName => array.push(this[popName]));
        array.push(this.index1.toFixed(3));
        array.push(this.index2.toFixed(3));

        return array;
    }
};

module.exports = PigProfile;
