/* Import Libraries */
const express = require('express');
const telnet_client = require('telnet-client');

/* Import Configurations */
const express_config = require('./config/express');
const telnet_config = require('./config/telnet');
const telnet_commands = require('./config/commands');

/* Initialize Clients / Server */
const app = express();
const telnet = new telnet_client();

/* Configure Telnet */ 
function heartbeat(){
    telnet.exec("date", function(err, response) {
        console.log("Heartbeat <",response)
        setTimeout(() => heartbeat(), telnet_config.connection_params.timeout - 1000);
    });
}

function execCommands(commands, index = 0){
    if(commands[index])
        telnet.exec(commands[index], function(error, response) {
            if(error)
                console.log(error)
            
            console.log(response)
            setTimeout(() => execCommands(commands, index+1), 100);
        });
    else
        console.log('Command-Array ended !')
}

telnet.on('ready', function(prompt) {
    console.log('Connection ready ! :)');
    heartbeat()
});
   
telnet.on('timeout', function() {
    console.log('Socket timeout!')
    telnet.end()
    console.log('Trying to reconnect in 10 Sec');
    setTimeout(() => telnet.connect(telnet_config.connection_params), 10*1000);
});
   
telnet.on('close', function() {
    console.log('Connection closed')
    console.log('Trying to reconnect in 10 Sec');
    setTimeout(() => telnet.connect(telnet_config.connection_params), 10*1000);
});

telnet.connect(telnet_config.connection_params);

/* Configure Express Webserver */
telnet_commands.forEach(function(telnet_command) {
    console.log(`Registering HTTP-Endpoint ${telnet_command.url}`)
    app.get(telnet_command.url, function(req, res) {
        execCommands(telnet_command.commands);
        res.send({ 'exec': telnet_command })
    })
});

/* Start Webserver */
app.listen(express_config.port, function(error) {
    if(error)
        console.log(error)
})