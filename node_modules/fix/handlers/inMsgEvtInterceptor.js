exports.newInMsgEvtInterceptor = function(session) {
    return new inMsgEvtInterceptor(session);
};


function inMsgEvtInterceptor(session){
    var self = this;
    this.incoming = function(ctx, event){
        if(event.type === 'data'){
            session.sessionEmitter.emit('incomingmsg',event.data[49], event.data[56], event.data);
        }
        else if(event.type==='resync'){
            self.emit('incomingresync',event.data[49], event.data[56], event.data);
        }

        ctx.sendNext(event);
    }
    
    this.outgoing = function(ctx, event){
        ctx.sendNext(event);
     }
}

