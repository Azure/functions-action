exports.newOutMsgEvtInterceptor = function(session) {
    return new outMsgEvtInterceptor(session);
};


function outMsgEvtInterceptor(session){
    var self = this;

    this.incoming = function(ctx, event){
        ctx.sendNext(event);
     }
     
    this.outgoing = function(ctx, event){
        if(event.type==='data'){
            var fixmap = convertToMap(event.data);
            session.sessionEmitter.emit('outgoingmsg',fixmap[49], fixmap[56], fixmap);
        }
        else if(event.type==='resync'){
            session.sessionEmitter.emit('outgoingresync',event.data[49], event.data[56], event.data);
        }

        ctx.sendNext(event);
    }
}

//TODO refactor, this is alraedy implemented in logonProcessor.js
//TODO refactor, this is already defined in logonProcessor.js
var SOHCHAR = String.fromCharCode(1);
function convertToMap(msg) {
    var fix = {};
    var keyvals = msg.split(SOHCHAR);
    for (var kv in Object.keys(keyvals)) {
        var kvpair = keyvals[kv].split('=');
        fix[kvpair[0]] = kvpair[1];
    }
    return fix;

}
