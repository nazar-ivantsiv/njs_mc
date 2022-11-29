/*
* Primary file for the API
*/

//Dependencies
var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');
var fs = require('fs');

// The server should respond to all requestss with a string
var server = http.createServer(function(req, res){
    unifiedServer(req, res);
});

// Start the server, and have it listen on port 3000
server.listen(config.httpPort, function(){
    console.log("The http serve is listening to port "+config.httpPort)
})

var httpsServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem'),
};

// The server should respond to all requestss with a string
var server = https.createServer(httpsServerOptions, function(req, res){
    unifiedServer(req, res);
});

// Start the server, and have it listen on port 3000
server.listen(config.httpsPort, function(){
    console.log("The https serve is listening to port "+config.httpsPort)
})

// All the server logic for both http and https servers
var unifiedServer = function(req, res){
    // Get the URL and parse it
    var parsedUrl = url.parse(req.url, true)    

    // Get the path from that URL
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g,'');

    // Get the query string as an object
    var queryStringObject = parsedUrl.query;
    
    // Get the HTTP Method
    var method = req.method.toLowerCase();

    // Get the headers as an object
    var headers = req.headers

    // Get the payload, if any
    var decoder = new StringDecoder('utf-8');
    var buffer = '';
    req.on('data', function(data){
        buffer += decoder.write(data);
    });
    req.on('end',function(){
        buffer += decoder.end();
        
        // Choose the handler this request should go to. If one if not found, use the notFound handler
        var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

        // Construct the data object to send to the handler
        var data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': buffer
        };

        // Route request to the handler specified in the router
        chosenHandler(data, function(statusCode, payload){
           
            // Use the status code called back by the handler or default
            statusCode = typeof(statusCode) == 'number' ? statusCode: 200;

            // Use the payload called back by the handler of default 
            payload = typeof(payload) == 'object' ? payload: {};

            // Convert the payload to a string
            payloadString = JSON.stringify(payload);

            // Return the response
            res.setHeader('Content-type', 'application/json');
            res.writeHeader(statusCode);
            res.end(payloadString);

            // Log the request details
            console.log('Returning this response', statusCode, payloadString);
            
        });

    });
};

// Define the handlers
var handlers = {};

// SAmple handler
handlers.sample = function(data, callback){
    // Callback a http status code, and payload object
    callback(406, {'name': 'sample handler'});
};

// Not found handler
handlers.notFound = function(data, callback){
    callback(404);
};

// Define a request router
var router = {
    'sample': handlers.sample
};
