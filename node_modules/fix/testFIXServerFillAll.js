var fix = require('./fix.js');

var orderIDs = 1;
var execIDs = 1;

fix.createServer({},function(session){
    console.log("EVENT connect");
    session.on("end", function(sender,target){ console.log("EVENT end"); });
    session.on("logon", function(sender, target){ console.log("EVENT logon: "+ sender + ", " + target); });
    session.on("incomingmsg", function(sender,target,msg){
        console.log("EVENT incomingmsg: "+ JSON.stringify(msg));
        var msgType = msg['35'];

        //new order single
        if(msgType === 'D'){
            var type = msg['40'];
            var isLimit = msg['40'] === '2';
            
            //send fill
            var orderID = orderIDs++;
            var clOrdID = msg['11'];
            var execID = execIDs++;
            var execTransType = '0'; //new
            var execType = '2';//fill
            var ordStatus = '2'; //filled
            var symbol = msg['55'];
            var side = msg['54'];
            var qty = msg['38'];
            var leaves = 0;
            var cumQty = qty;
            var avgpx = 100; //if there is limit price, this will be overwritten by limit
            var lastpx = 100; //if there is limit price, this will be overwritten by limit
            var lastshares = qty;
            
            var outmsg = {'35':'8', '37':orderID, '11':clOrdID, '17':execID, '20':execTransType, '150':execType, '39':ordStatus, '55':symbol, '54':side, '38':qty, '151':leaves, '14':cumQty, '6':avgpx, '32': lastshares, '31':lastpx };
            if(isLimit){
                outmsg['44'] = msg['44']; //price
                outmsg['6'] = msg['44']; //avg px
                outmsg['31'] = msg['44']; //last price
            }
            
            session.write(outmsg);
        }
    });
    session.on("outgoingmsg", function(sender,target,msg){ console.log("EVENT outgoingmsg: "+ JSON.stringify(msg)); });

}).listen(1234, "localhost");

