exports.newTemplate= function(session) {
    return new template(session);
};


function template(session){
    var self = this;

    //||||||||||INCOMING||||||||||INCMOING||||||||||INCOMING||||||||||INCOMING||||||||||INCOMING||||||||||INCOMING||||||||||
    this.incoming = function(ctx, event){
        if(event.type !== 'data'){
            ctx.sendNext(event);
            return;
        }

    }
    
    //||||||||||OUTGOING||||||||||OUTGOING||||||||||OUTGOING||||||||||OUTGOING||||||||||OUTGOING||||||||||OUTGOING||||||||||
    this.outgoing = function(ctx, event){
        ctx.sendNext(event);
     }
}

