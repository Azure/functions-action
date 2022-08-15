var fix = require('./fix.js');

fix.createServer({},function(session){
    console.log("EVENT connect");
    session.on("end", function(sender,target){ console.log("EVENT end"); });
    session.on("logon", function(sender, target){ console.log("EVENT logon: "+ sender + ", " + target); });
    session.on("incomingmsg", function(sender,target,msg){ console.log("EVENT incomingmsg: "+ JSON.stringify(msg)); });
    session.on("outgoingmsg", function(sender,target,msg){ console.log("EVENT outgoingmsg: "+ JSON.stringify(msg)); });

}).listen(1234, "localhost");

