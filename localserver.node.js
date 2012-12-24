var http = require('http'),
	url = require('url'),
	fs = require('fs');

process.on('uncaughtException', function (err) {
	console.error('\033[31m' + 'Caught exception: ' + err);
});

var EXT_TO_MINE = {
		'jpg' : 'image/jpeg',
		'jpeg' : 'image/jpeg',
		'gif' : 'image/gif',
		'png' : 'image/png',
		'html' : 'text/html',
		'js' : 'application/x-javascript',
		'css' : 'text/css'
	},
	TEXT_SET = {
		'html' : 1,
		'js' : 1,
		'css' : 1
	},
	ENCODING = 'binary';
var getContentTypeByExt = function(name){
	var ext = name.substr(name.lastIndexOf('.')+1),
		type = EXT_TO_MINE[ext] || 'application/unknown';
	if(ext in TEXT_SET){
		type += '; charset=utf-8';
	}
	return type;
};

var remoteData = {};

var getRemote = function(url, callback){
	http.get('http://' + url, function(res){
		var data = '';
		res.setEncoding(ENCODING);
		res.on('data',function(chunk){
			data += chunk;
			// console.info('Chunk: ' + chunk);
		});
		res.on('end',function(){
			callback({
				statusCode : res.statusCode,
				headers : res.headers,
				data : data
			});
		});
	}).on('error', function(err){
		console.error('\033[31m' + err);
	});
}

http.createServer(function (req, res) {
	var host = req.headers.host,
		href = host + req.url;
	if(href in remoteData){
		var data = remoteData[href];
		res.writeHead(data.statusCode, data.headers);
		res.end(data.data, ENCODING);
		console.log('\033[34m' + href);
	}else{
		var pathname = url.parse(req.url).pathname;
		if(pathname === '/'){
			pathname = '/index.html';
		// }else if(-1 !== host.indexOf('web.qstatic.com') && 0 === pathname.indexOf('/webqqpic')){
			// pathname = pathname.substr(9);
		}
		fs.readFile('.' + pathname, function(err, data){
			if(err){
				res.writeHead(404, {'Content-Type': 'text/html'});
				res.end('404 Not Found\n');
				// getRemote(href, function(data){
					// remoteData[href] = data;
					// res.writeHead(data.statusCode, data.headers);
					// res.end(data.data, ENCODING);
					// console.log('\033[34m' + href);
				// });
			}else{
				res.writeHead(200, {
					'Content-Type': getContentTypeByExt(pathname),
					'Content-Length': data.length
					/*, 'Cache-Control': 'max-age=0'*/
				});
				res.end(data);
				console.log('\033[0m' + href);
			}
		});
	}
}).listen(80);
console.log('Server running');