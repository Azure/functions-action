var Pipeline = require("./nodepipe");
var assert = require("assert");
var sys = require('sys');

var tests = {
    multipleHandlers: function () {
        var target = "x";

        var p = Pipeline.makePipe(null);
        p.addHandler({
            incoming: function (ctx, evt) {
                target = evt;
                ctx.sendNext(evt + evt);
            },
            description: "first"
        });
        p.addHandler({
            incoming: function (ctx, evt) {
                target = evt;
            },
            description: "second"
        });

        p.pushIncoming("yo");

        assert.equal(p.toString(), "first,second");
    },
    stateobject: function () {

        var p = Pipeline.makePipe(null);
        p.addHandler({
            incoming: function (ctx, evt) {
		ctx.state['hello'] = "world";
                ctx.sendNext(evt + evt);
            },
            description: "first"
        });
        p.addHandler({
            incoming: function (ctx, evt) {
		assert.equal(ctx.state['hello'], "world");
            },
            description: "second"
        });

        p.pushIncoming("yo");

    },
    propagateSendNextIncoming4Handlers: function () {
        var target = "x";

        var p = Pipeline.makePipe(null);
        p.addHandler({
            incoming: function (ctx, evt) {
                target = evt;
                ctx.sendNext(evt + evt);
            }
        });
        p.addHandler({
            incoming: function (ctx, evt) {
                target = evt;
                ctx.sendNext(evt + evt);
            }
        });
        p.addHandler({
            incoming: function (ctx, evt) {
                target = evt;
                ctx.sendNext(evt + evt);
            }
        });
        p.addHandler({
            incoming: function (ctx, evt) {
                target = evt;
                //ctx.sendNext(evt + evt);
            }
        });

        p.pushIncoming("yo");

        assert.equal(target, "yoyoyoyoyoyoyoyo");
    },
    propagateSendNextIncomingOutgoingInterleavedHandlers: function () {
        var target = "x";

        var p = Pipeline.makePipe(null);
        p.addHandler({
            incoming: function (ctx, evt) {
                target = evt;
                //console.log("herea");
                ctx.sendNext(evt + evt);
            },
            outgoing: function (ctx, evt) {
                target = "yup";
                //console.log("herez");
                ctx.sendNext(evt + evt);
            }
        });
        p.addHandler({//should be ignored
            outgoing: function (ctx, evt) {
                //target = evt;
                //console.log("herex");
                ctx.sendNext(evt + evt);
            }
        });
        p.addHandler({
            incoming: function (ctx, evt) {
                target = evt;
                //console.log("here");
                ctx.sendNext(evt + evt);
            }
        });
        p.addHandler({//should be ignored
            incoming: function (ctx, evt) {
                //target = evt;
                ctx.sendPrev(evt + evt);
            }
        });

        p.pushIncoming("yo");

        assert.equal(target, "yup");
    },
    lastHandlerCallsSendNext: function () {
        var target = "x";

        var p = Pipeline.makePipe(null);
        p.addHandler({description:"handler1", 
            incoming: function (ctx, evt) {
                target = evt;
                //console.log("in h1:"+sys.inspect(ctx));
                ctx.sendNext(evt + evt);
            }
        });
        p.addHandler({description:"handler2", 
            incoming: function (ctx, evt) {
                target = evt;
                //console.log("in h2:"+sys.inspect(ctx));
                ctx.sendNext(evt);
            }
        });

        p.pushIncoming("yo");

        assert.equal(target, "yoyo");
    },
    propagateSendNextIncomingHandlers: function () {
        var target = "x";

        var p = Pipeline.makePipe(null);
        p.addHandler({
            incoming: function (ctx, evt) {
                target = evt;
                ctx.sendNext(evt + evt);
            }
        });
        p.addHandler({
            incoming: function (ctx, evt) {
                target = evt;
            }
        });

        p.pushIncoming("yo");

        assert.equal(target, "yoyo");
    },
    propagateSendNextOutgoingHandlers: function () {
        var target = "x";

        var p = Pipeline.makePipe(null);
        p.addHandler({
            outgoing: function (ctx, evt) {
                target = evt;
            }
        });
        p.addHandler({
            outgoing: function (ctx, evt) {
                target = evt;
                ctx.sendNext(evt + evt);
            }
        });

        p.pushOutgoing("yo");

        assert.equal(target, "yoyo");
    },
};






for (var testx in Object.keys(tests)) {
    if (true) {
        console.log("\n\n============Running " + Object.keys(tests)[testx]);
        tests[Object.keys(tests)[testx]].call();
    }
}
