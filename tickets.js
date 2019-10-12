const fs = require('fs');
const path = require('path');
const pdf = require('html-pdf');

const COLUMNS = 3;

const ORGNANE = "Организация";

const CODEX = {
    "111": "ID",
    "333": "NAME",
    "444": "SNAME",
    "222": "SURNAME",
    "555": "PHOTO",
    "666": "DATE"
};

const BREAKER = "****";

const base = path.resolve();
console.log();
const PDF_OPTIONS = {
    // если билеты режутся на переходах между страницами, то нужно покрутить поля
    "border": {
        "top": "1cm",            // default is 0, units: mm, cm, in, px
        "right": "2cm",
        "bottom": "0",
        "left": "2cm"
    },
    "base": "file:///" + base.replace("\\", "/") + "/",
    "format": "A3"
};

// читаем шаблон
fs.readFile('template.html', "utf8", (err, data)=>{
    const template = data;
    fs.readFile('readers.txt', "utf8", (err, data)=>{
        const readerData = (data.split("\n"));
        const readers = [];
        let reader = {};
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
        console.log(readers)
        let result = '<link rel="stylesheet" type="text/css" href="./styles.css"><div class="ticket-container">';
        let currentCol = 0;
        for (let i = 0; i < readers.length; i++){
            // клонирование шаблона, подстановка того что надо
            result += template;
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