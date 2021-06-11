var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var fs = require('fs');
var system = require('child_process');
const { GoogleSpreadsheet } = require('google-spreadsheet');
// working: 1ucoUEqCf_r4SyJbDXoOwUafsSkyk0YnoMLNLrIDdmuA
//14aRrwBgfynaMNotKUoYJAxqA8DrdkA2kccm_m4enRSk
var doc = new GoogleSpreadsheet('14aRrwBgfynaMNotKUoYJAxqA8DrdkA2kccm_m4enRSk');
const creds = require('./config.json');
var sheet,log;
setupSheet().catch(()=>{})

var file = {
	save: function(name,text){
		fs.writeFile(name,text,e=>{
			if(e) console.log(e);
		});
	},
	read: function(name,callback){
		fs.readFile(name,(error,buffer)=>{
			if (error) console.log(error);
			else callback(buffer.toString());
		});
	}
}

class client{
	static all = [];
	constructor(socket){
		this.socket = socket;
		this.name = null;
		this.tiles = [];
		client.all.push(this);
		socket.on('disconnect',e=>{
			let index = client.all.indexOf(this);
			if(index != -1){
				client.all.splice(index,1);
			}
		});
	}
	emit(name,dat){
		this.socket.emit(name,dat);
	}
}

const port = 8080;
const path = __dirname+'/';

app.use(express.static(path+'site/'));
app.get(/.*/,function(request,response){
	response.sendFile(path+'site/');
});

http.listen(port,()=>{console.log('Serving Port: '+port)});

io.on('connection',socket=>{
	var c = new client(socket);
	socket.on('getData',()=>{
		console.log('Clicked');
		getCellData(0,0,4,4).then(data=>{socket.emit('data',data)});
	});
	socket.on('log',addLog);
});

async function getCellData(xs,ys,w,h){
	await sheet.loadCells(); 
	let result = [];
	for(let x=xs;x<xs+w;x++){
		let arr = [];
		for(let y=ys;y<ys+h;y++){
			arr.push(sheet.getCell(x,y).value);
		}
		result.push(arr);
	}
	console.log(result);
	return result;
}

async function addLog(data){
	await log.loadCells();
	log.addRow(data);
	log.saveUpdatedCells();
	console.log('Logged',data);
}

async function setupSheet(){
	let a = await doc.useServiceAccountAuth(creds);
	await doc.loadInfo(); // loads document properties and worksheets
	sheet = doc.sheetsByIndex[0]; // or use doc.sheetsById[id] or doc.sheetsByTitle[title]
	log = doc.sheetsByTitle['Log'];
}