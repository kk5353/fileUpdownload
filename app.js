var http = require("http");
var fs = require("fs");
var child_process = require('child_process');
var uuid = require('uuid');
const path11 = require('path');

result = {
    error_code: -1,
    message: ''
};

http.createServer(function (req, res) {
    let type = require('url').parse(req.url, true).query.type;
    let file = require('url').parse(req.url, true).query.file;



    res.writeHead(200, {
        "Content-type": "text/html;charset=UTF-8",
        "Access-Control-Allow-Origin": "*"
    });



    if (req.method.toLowerCase() == "post") {

        //新建一个空数组接受流的信息
        var chunks = [];
        //获取长度
        let num = 0;
        req.on("data", function (chunk) {
            console.log(chunk.length);
            chunks.push(chunk);
            num += chunk.length;
        });


        req.on("end", function () {
            //最终流的内容本体
            var buffer = Buffer.concat(chunks, num);
            console.log('-----------123---------');
            console.log(buffer.length);
            //新建数组接收出去\r\n的数据下标
            let rems = [];
            //根据\r\n分离数据和报头
            for (var i = 0; i < buffer.length; i++) {
                let v = buffer[i];
                let v2 = buffer[i + 1];
                // 10代表\n 13代表\r
                if (v == 13 && v2 == 10) {
                    rems.push(i)
                }
            } //for
            if (buffer.toString().indexOf("filename") == -1) {
                console.log('上传数据中不包含文件');
                result.message = '上传数据中不包含文件';
            } else {


                console.log(typeof rems);
                console.log(JSON.stringify(rems));
                //获取上传图片信息
                let picmsg_1 = buffer.slice(rems[0] + 2, rems[1]).toString();


                let filename = picmsg_1.match(/filename=".*"/g)[0].split('"')[1];
                console.log(filename);

                //图片数据
                var nbuf = buffer.slice(rems[3] + 2, rems[rems.length - 2]);
                let addressPNG = uuid() + '--qianzongbangbangde--' + filename;
                let address = "./upload/" + addressPNG;

                //创建空文件并写入内容
                fs.writeFile(address, nbuf, function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("创建成功" + address);

                        if (type == 1) {

                            console.log(path11.join('TransFile/TransMsFile.exe'));
                            let pathpdf = path11.join(address).substr(0, (path11.join(address)).lastIndexOf('.')) + '.pdf';
                            console.log(path11.join('upload'));


                            var spawnObj = child_process.execFile(path11.join('TransFile/TransMsFile.exe'), [path11.join(address), pathpdf], {
                                encoding: 'utf-8'
                            });
                            spawnObj.stdout.on('data', function (chunk) {
                                console.log(chunk.toString());
                                console.log("转换进行中");
                            });
                            spawnObj.stderr.on('data', (data) => {
                                console.log(data);
                                console.log("转换错误");
                            });
                            spawnObj.on('exit', (code) => {
                                console.log('退出转换，状态码 : ' + code);
                                fs.close(2, function (err) {
                                    if (err) {
                                        console.error(err);
                                    }
                                });
                            });
                            spawnObj.on('close', function (code) {
                                console.log('close code : ' + code);
                                console.log("转换结束");
                                //此处开始转换为图片

                                fs.mkdir(pathpdf.substr(0, pathpdf.lastIndexOf('.')), () => {
                                    console.log('创建文件夹成功' + address.substr(0, address.lastIndexOf('.')));
                                    // stringObject.substr(start [, length ])
                                    var spawnObjPNG = child_process.execFile(path11.join('transpdf2image/lightpdf2png_4.exe'), [pathpdf, address.substr(0, address.lastIndexOf('.'))], {
                                        encoding: 'utf-8'
                                    });
                                    spawnObjPNG.stdout.on('data', function (chunk) {
                                        result.info = JSON.parse(chunk);
                                        console.log("png转换进行中");
                                    });
                                    spawnObjPNG.stderr.on('data', (data) => {
                                        console.log("png转换错误");
                                        console.log(data);
                                        console.log("png转换错误");
                                    });

                                    spawnObjPNG.on('exit', (code) => {
                                        console.log('png退出转换，状态码 : ' + code);
                                        fs.close(2, function (err) {
                                            if (err) {
                                                console.error(err);
                                            }
                                        });
                                    });
                                    spawnObjPNG.on('close', function (code) {
                                        console.log('close code : ' + code);
                                        console.log("png转换结束");
                                        result.error_code = 0;
                                        result.message = "文件上传成功，转换为图片完毕"
                                        console.log('返回结果');
                                        result.downloadAddress = address.substr(0, address.lastIndexOf('.')) + '/' + addressPNG.substr(0, addressPNG.lastIndexOf('.')) + '0000.png';
                                        res.end(JSON.stringify(result));
                                    });
                                });
                            });


                        } else { //如果type=0，不需要转换，只需要返回下载链接

                            console.log('不需要转换，仅仅返回下载地址');

                            result.error_code = 0;
                            result.message = "文件上传成功，返回下载地址"
                            console.log('返回结果');
                            result.downloadAddress = address;
                            res.end(JSON.stringify(result));
                        }
                    }
                })
            }

        })
    }

    if (req.method.toLowerCase() == "get") {
        //第二种方式
        console.log(file);
        var f = fs.createReadStream(path11.join(file));
        res.writeHead(200, {
            'Content-Type': 'application/force-download',
            'Content-Disposition': 'attachment; filename=' + file.substr(file.lastIndexOf('--qianzongbangbangde--')+22)
        });
        f.pipe(res);
        console.log('文件下载了');
    }
}).listen(4040);
console.log('文件上传下载服务开始：4040')