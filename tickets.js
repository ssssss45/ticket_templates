const fs = require('fs');
const path = require('path');
const pdf = require('html-pdf');
// const barcode = require('barcode');
// const gm = require('gm').subClass({ imageMagick: true });
const bwipjs = require('bwip-js');


const COLUMNS = 3;

const ORGNAM = "Организация";

const CODEX = {
    "#30": "IDENTIFIER",
    "#11": "NAME",
    "#12": "SNAME",
    "#10": "SURNAME",
    "#950": "PHOTO",
    "#53": "DATE"
};

const STYLECODEX = {
    "NAME": {key:"NAMEHEIGHT", default:17, limit: 15},
    "SNAME": {key:"SNAMEHEIGHT", default:17, limit: 15},
    "SURNAME" : {key:"SURNAMEHEIGHT", default:25, limit: 10}
};

const BREAKER = "*****";

const base = path.resolve();

const PDF_OPTIONS = {
    // если билеты режутся на переходах между страницами, то нужно покрутить поля
    "border": {
        "top": "1cm",            // default is 0, units: mm, cm, in, px
        "right": "2cm",
        "bottom": "0",
        "left": "2cm"
    },
    "base": "file:///" + base.replace("\\", "/") + "/",
    "format": process.argv[2] === "A3" ? "A3" : "A4",
    "orientation": process.argv[2] === "A3" ? "portrait" : "landscape"
};

// читаем шаблон
fs.readFile('template.html', "utf8", (err, data)=>{
    const template = data;
    fs.readFile('readers.txt', "utf8", (err, data)=>{
        const readerData = (data.split("\n"));
        const readers = [];
        let reader = {};
        // разбираем список читателей
        for (let i = 0; i < readerData.length; i++){
            const split = readerData[i].split(":");
            const type =  split[0];
            const data = split[1];
            if (CODEX[type]){
                reader[CODEX[type]] = data.split("\r")[0];
            }
            if (type.split("\r")[0] === BREAKER){
                readers.push(reader);
                reader = {};
            }
        }
        let result = '<link rel="stylesheet" type="text/css" href="./styles.css"><div class="ticket-container">';
        let currentCol = 0;
        for (let i = 0; i < readers.length; i++){
            // клонирование шаблона, подстановка того что надо
            let currentTemplate = template;
            const keys = Object.keys(readers[i]);
            // подстановка данных
            // const code39 = barcode('code39', {
            //     data: "TEST",
            //     width: 206,
            //     height: 80,
            // });
            const outfile = path.join(base, 'barcodes', readers[i].IDENTIFIER+".png");
            currentTemplate = currentTemplate.replace("{{BARCODE}}", outfile);
            bwipjs.toBuffer({
                bcid:        'code39',       // Barcode type
                text:        'TEST',    // Text to encode
                scale:       3,               // 3x scaling factor
                height:      13,              // Bar height, in millimeters
                includetext: false,            // Show human-readable text
                textxalign:  'center',        // Always good to set this
            }, function (err, png) {
                if (err) {
                    console.log(err)
                    // Decide how to handle the error
                    // `err` may be a string or Error object
                } else {
                    fs.writeFile(outfile, png, 'base64', function(err) {
                        console.log(err);
                    });

                    // `png` is a Buffer
                    // png.length           : PNG file length
                    // png.readUInt32BE(16) : PNG image width
                    // png.readUInt32BE(20) : PNG image height
                }
            });
            // console.log(path.join(base, 'barcodes', readers[i].IDENTIFIER.split(" ")[1]+".png"));
            // base + "\\barcodes\\"+readers[i].IDENTIFIER+".png";
            // code39.saveImage(outfile, function (err) {
            //     // if (err) throw err;
            //
            //     console.log('File has been written!');
            // });
            keys.forEach(key=>{
                currentTemplate = currentTemplate.replace("{{"+key+"}}", readers[i][key]);
                // стили
                if (STYLECODEX[key]){
                    currentTemplate = currentTemplate.replace("{{"+STYLECODEX[key].key+"}}", readers[i][key].length >  STYLECODEX[key].limit ? STYLECODEX[key].default - (readers[i][key].length - STYLECODEX[key].limit) * 1.3 : STYLECODEX[key].default);
                }
            });
            // подстановка названия организации
            currentTemplate = currentTemplate.replace("{{ORGNAM}}", ORGNAM);
            result += currentTemplate;
            currentCol ++;
            if (currentCol === COLUMNS){
                currentCol = 0;
            }
        }
        result += "</div>";

        fs.writeFile("result.html", result, ()=>{
            const html = fs.readFileSync('./result.html', 'utf8');
            pdf.create(html, PDF_OPTIONS).toFile('./result.pdf', (err)=>{console.log(err)});
        });
    });
});