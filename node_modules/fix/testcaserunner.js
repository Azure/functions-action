var fs = require('fs');
var net = require('net');
var fix = require('./fix.js');
var fixutil = require('./fixutils.js');
var _  = require('underscore');
_.mixin(require('underscore.string'));

var file = process.argv[2];

fs.readFile(file,encoding='UTF8', function (err, data) {
    if (err) throw err;
    var self  = this;
    
    var lines = data.split('\n');
    var commandQ = new Queue();
    
    var fixServer = null;
    var fixClient = null;
  
    
    _.each(lines,function(str){
        var c = str.charAt(0);
        if(c==='i' || c==='e' || c==='I' || c==='E'){
            commandQ.queue(str);
        }
    });
    
    
    var str = commandQ.dequeue();
    processCommand(str);
    
    function processCommand(str){
        console.log("Processing "+str);
        var direction = str.charAt(0);
        var msg = _.trim(str.substr(1,str.length));

        if(direction=== '#'){ return ;}

        //initiate connection
        if(direction=== 'i'){
            self.fixServer = fix.createServer({},function(session){
                
                //console.log("EVENT connect");
                //session.on("end", function(sender,target){ console.log("EVENT end"); });
                //session.on("logon", function(sender, target){ console.log("EVENT logon: "+ sender + ", " + target); });
                //session.on("incomingmsg", function(sender,target,msg){ console.log("Server incomingmsg: "+ JSON.stringify(msg)); });
                //session.on("outgoingmsg", function(sender,target,msg){ console.log("Server outgoingmsg: "+ JSON.stringify(msg)); });
                           
            });
            self.fixServer.listen(1234, "localhost", function(){
                 //'listen' callback
                 //start fix client
                 self.fixClient = fix.createClient("FIX.4.2", "initiator", "acceptor",{sendHeartbeats:false});
                 self.fixClient.connect(1234,"localhost");
                 self.fixClient.on("connect", function(){
                     console.log("Client connected");
                    if(!_.startsWith(commandQ.peek(), "E")){
                        processCommand(commandQ.dequeue());
                    }

                });
                 self.fixClient.on("incomingmsg", function(sender, target,msg){
                    //console.log("Client incomingmsg:"+JSON.stringify(msg));
                    var expectedRaw = commandQ.dequeue();
                    console.log("Processing "+expectedRaw);
                    if(!_.startsWith(expectedRaw,"E")){
                        console.log("ERROR: expected an 'E' command but received: "+expectedRaw);
                        return;//throw error
                    }
                    
                    var expected = _.trim(expectedRaw.substr(1,expectedRaw.length));
                    
                    var expectedMap = fixutil.convertToMap(expected);
                    var errorlist = compareMapFIX(msg, expectedMap);
                    
                    if(errorlist.length > 0){
                        console.log("ERROR: "+JSON.stringify(errorlist));
                        return;//throw error
                    }
                    if(!_.startsWith(commandQ.peek(), "E")){
                        processCommand(commandQ.dequeue());
                    }
                });

            });

        }

        //expected disconnect
        if(direction=== 'e'){
            self.fixClient.logoff();
            self.fixServer.logoff();
        }

        //msgs sent to fix engine
        if(direction === 'I'){
            var map = fixutil.convertToMap(msg);
            //var fixmap = fixutil.convertRawToFIX(map);
            self.fixClient.write(map);
            
            if(!_.startsWith(commandQ.peek(), "E")){
                    processCommand(commandQ.dequeue());
            }
        }

        //msgs expected from fix engine
        if(direction === 'E'){
            //expectedQ.queue(str);
        }
    };
});

//compare FIX messages
function compareStringFIX(fixActual, fixExpected){
    var actual = fixutil.convertToMap(fixActual);
    var expected = fixutil.convertToMap(fixExpected);
    compareMapFIX(actual, expected);
}
function compareMapFIX(actual, expected){
    var errorlist = new Queue();
        
    //remove time sensitive keys
    delete actual[9];
    delete actual[10];
    delete actual[52];
    delete expected[9];
    delete expected[10];
    delete expected[52];
    
    var isequal = _.isEqual(actual,expected);
    if(!isequal){
        console.log("errors found:\n Expected msg:"+JSON.stringify(expected)+"\n Actual msg  :"+JSON.stringify(actual));
        _.each(actual, function(val, tag){
            var tagmatches = expected[tag] === val;
            if(!tagmatches){
                console.log(" Tag "+tag+" expected value "+expected[tag]+" but received "+val);
                var errorobj = {actualMsg:actual, expectedMsg:expected, tag:tag, actualTagVal:val, expectedTagVal:expected[tag]};
                errorlist.queue(errorobj);
            }
        });
    }
    return errorlist;
}

//Queue data structure from wikipedia
//http://en.wikipedia.org/wiki/Queue_(data_structure)#Example_Javascript_code
function Queue(){
    this.data = [];
    this.head = 0;
    this.count = 0;
 
    this.size = function(){
        return this.count < 0 ? 0 : this.count;
    }
 
    this.queue = function(obj){
        this.data[this.count++] = obj;
    }
 
    this.dequeue = function(){
        //Amortizes the shrink frequency of the queue
        if(--this.count < this.data.length*0.9){
            this.data = this.data.slice(this.head);
            this.head = 0;
        }
        return this.data[this.head++];
    }
 
    this.peek = function(){
        return this.data[this.head];
    }
 
    this.isEmpty = function(){
        return this.count <= 0;
    }
}