const fs = require('fs');
const path = require('path');
const pdf = require('html-pdf');

const COLUMNS = 3;
const ITEMS = 30;

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
console.log(PDF_OPTIONS.base)

fs.readFile('template.html', "utf8", (err, data)=>{
    const template = data;
    let result = '<link rel="stylesheet" type="text/css" href="./styles.css"><div class="ticket-container">';
    let currentCol = 0;
    for (let i = 0; i < ITEMS; i++){
        // клонирование шаблона, подстановка того что надо
        result += template;
        currentCol ++;
        if (currentCol === COLUMNS){
            currentCol = 0;
           // result += "</tr><tr>";
        }
    }
    result += "</div>";
    fs.writeFile("result.html", result, ()=>{
        const html = fs.readFileSync('./result.html', 'utf8');
        pdf.create(html, PDF_OPTIONS).toFile('./result.pdf', (err)=>{console.log(err)});
    });

});