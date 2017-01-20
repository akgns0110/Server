
/**
 * 데이터베이스 사용하기
 * 
 * 데이터베이스 열고 로그인 화면에 붙이기
 * 
 */

//===== 모듈 불러들이기 =====//
var express = require('express')
  , http = require('http')
  , path = require('path');

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var expressErrorHandler = require('express-error-handler');

var mongodb = require('mongodb');


//===== Express 서버 객체 만들기 =====//
var app = express();


//===== 서버 변수 설정 및 static으로 public 폴더 설정  =====//
app.set('port', process.env.PORT || 3000);
app.use('/public', express.static(path.join(__dirname, 'public')));

//===== body-parser, cookie-parser, express-session 사용 설정 =====//
app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieParser());
app.use(expressSession({
	secret:'my key',
	resave:true,
	saveUninitialized:true
}));

//===== 라우터 미들웨어 사용 =====//


//===== 데이터베이스 연결 =====//

var database;

//데이터베이스에 연결하고 응답 객체의 속성으로 db 객체 추가
function connectDB() {
	// 데이터베이스 연결 정보
	var databaseUrl = 'mongodb://localhost:27017/subway';
	
	// 데이터베이스 연결
	mongodb.connect(databaseUrl, function(err, db) {
		if (err) throw err;
		
		console.log('데이터베이스에 연결되었습니다. : ' + databaseUrl);
		
		// database 변수에 할당
		database = db;
	});
}


// 로그인 처리 함수
app.post('/process/login', function(req, res) {
	console.log('/process/login 호출됨.');

	var paramId = req.param('Area');
	var paramPassword = req.param('Train_ID');
	
	if (database) {
		authUser(database, paramId, paramPassword, function(err, docs) {
			if (err) {throw err;}
			
			if (docs) {
				console.dir(docs);
				res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h1>로그인 성공</h1>');
				for(var k=0;k<docs.length;k++){
					res.write('<div><p>지 역 : ' + docs[k].Area+' 열차 번호 : '+docs[k].Train_ID+' 위 치 : '+docs[k].Location+' 1호차1 : '+docs[k].t1_1+' 1호차2 : '+docs[k].t1_2
							+' 1호차3 : '+docs[k].t1_3+' 2호차1 : '+docs[k].t2_1+' 2호차2 : '+docs[k].t2_2+' 2호차3 : '+docs[k].t2_3+' 3호차1 : '+docs[k].t3_1
							+' 3호차2 : '+docs[k].t3_2+' 3호차3 : '+docs[k].t3_3+' 4호차1 : '+docs[k].t4_1+' 4호차2 : '+docs[k].t4_2+' 4호차3 : '+docs[k].t4_3
							+'</p></div>');
				}
				res.write("<br><br><a href='/public/login.html'>다시 로그인하기</a>");
				res.end();
			
			} else {
				res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h1>로그인  실패</h1>');
				res.write('<div><p>아이디와 패스워드를 다시 확인하십시오.</p></div>');
				res.write("<br><br><a href='/public/login.html'>다시 로그인하기</a>");
				res.end();
			}
		});
	} else {
		res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
		res.write('<h2>데이터베이스 연결 실패</h2>');
		res.write('<div><p>데이터베이스에 연결하지 못했습니다.</p></div>');
		res.end();
	}
	
});


// 사용자를 인증하는 함수
var authUser = function(database, Area, Train_ID, callback) {
	console.log('authUser 호출됨.');
	
    // users 컬렉션 참조
	var users = database.collection('users');

    // 아이디와 비밀번호를 이용해 검색
	users.find({"Area":Area, "Train_ID":Train_ID}).toArray(function(err, docs) {
		if (err) {
			callback(err, null);
			return;
		}
		
	    if (docs.length > 0) {
	    	console.log('아이디 [%s], 패스워드 [%s] 가 일치하는 사용자 찾음.', Area, Train_ID);
	    	callback(null, docs);
	    } else {
	    	console.log("일치하는 사용자를 찾지 못함.");
	    	callback(null, null);
	    }
	});
}


//===== 404 에러 페이지 처리 =====//
var errorHandler = expressErrorHandler({
 static: {
   '404': './public/404.html'
 }
});

app.use( expressErrorHandler.httpError(404) );
app.use( errorHandler );


//===== 서버 시작 =====//
http.createServer(app).listen(app.get('port'), function(){
  console.log('서버가 시작되었습니다. 포트 : ' + app.get('port'));

  // 데이터베이스 연결
  connectDB();
   

});
