const http = require('http')

const server = http.createServer((req, res) => {
    res.writeHead(200)
    res.end("server created")
    
    if(req.url === "localhost:3000/home"){
        res.writeHead(200)
        res.end("this is homepage")
    }
})

server.listen('3000', console.log("server running on port 3000"))





