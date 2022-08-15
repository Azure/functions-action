/**
* Implementation detail
*/
function Node(handler) {
    this.description = handler.description || "unnamed";
    this.incoming = handler.incoming || function (ctx, event) { ctx.sendNext(event)  };
    this.outgoing = handler.outgoing || function (ctx, event) { ctx.sendNext(event)  };
    this.next = null;
    this.prev = null;
}

/**
* Implementation of the Pipeline class
* Pipeline is a bi-directional, ordered chain of functions. Each function in the pipeline
* communicates with the next function through an interface provided by the pipeline.
*
* Functions inside the pipeline need to accept events and context objects. Context objects provide a
* way to communicate with the next or previous functions and access to pipe-level global variables.
*
* 'Pipeline' is inspired by pipelines of Java's netty and grizzly projects. It implements a
* bi-directional 'intercepting-filter.' 
*
* The implementation of based on a linked-list.
*/
function Pipeline(stream) {
    var self = this;
    this.first = null;
    this.last = null;
    this.state = {};

    this.addHandler = function (handler) {
        var node = new Node(handler);
        if (self.first === null) {
            self.first = node;
            self.last = node;
            node.next = null;
        }
        else {
            self.last.next = node;
            node.prev = self.last;
            self.last = node;
            node.next = null;
        }
    };

    this.pushIncoming = function (evt) {

        self.first.incoming(makeCtx(self.first, stream, true, self.state), evt);
    };

    this.pushOutgoing = function (evt) {

        self.last.outgoing(makeCtx(self.last, stream, false, self.state), evt);
    };

    this.pushIncomingData = function (data) {

        self.first.incoming(makeCtx(self.first, stream, true, self.state), {
            eventType: "data",
            data: data
        });
    };

    this.pushOutgoingData = function (data) {

        self.last.outgoing(makeCtx(self.last, stream, false, self.state), {
            eventType: "data",
            data: data
        });
    };


    this.toString = function () {
        var nodes = [];
        var node = self.first;
        while (node !== null) {
            nodes.push(node.description);
            node = node.next;
        }
        return nodes.join(","); //TODO add 'state' object to the output as well
    };

}


function makeCtx(node, stream, isIncoming, stateobj) {

    var incomingCtx = function (evt) {
        if (node.next !== null) {
            node.next.incoming(makeCtx(node.next, stream, true, stateobj), evt);
        }
    };
    var outgoingCtx = function (evt) {
        if (node.prev != null) {
            node.prev.outgoing(makeCtx(node.prev, stream, false, stateobj), evt);
        }
    };

    if (isIncoming) {
        return {
            sendNext: incomingCtx,
            sendPrev: outgoingCtx,
            stream: stream,
            state: stateobj
        };
    }
    else {
        return {
            sendNext: outgoingCtx,
            sendPrev: incomingCtx,
            stream: stream,
            state: stateobj
        };
    }
}

exports.makePipe = function (stream) {
    return new Pipeline(stream);
}
