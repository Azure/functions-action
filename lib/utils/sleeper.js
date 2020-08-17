"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Sleeper {
    static timeout(ms) {
        return new Promise(res => setTimeout(res, ms));
    }
}
exports.Sleeper = Sleeper;
