"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const state_1 = require("../constants/state");
class InitializeHandler {
    invoke(currentState) {
        currentState = state_1.StateConstant.Succeed;
        return currentState;
    }
}
exports.InitializeHandler = InitializeHandler;
