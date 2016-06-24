//
//
"use strict";

class PigProfile {
    constructor() {
        this.colums = [];
        this.result = [];
    }

    loadFromString(str) {
        if(!str) {
            return;
        }

        var self = this;
        var lines = str.split(/[\r\n]+/);
        lines.forEach((line, i) => {
            var fields = line.split(/[\s,;|]+/);
            if(!fields) {
                return;
            }

            fields.forEach((item, i) => {
                if(!self.colums[i]) {
                    self.colums[i] = [];
                }

                self.colums[i].push(item);
            });
        });

        return;
    }
};

module.exports = PigProfile;
