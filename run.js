var http = require('needle');
var fs = require('graceful-fs');
var cheerio = require('cheerio');
var progbar = require('progbar');

http.get('http://datos.gob.cl/dataset/registros-de-importacion-2016', function (err, res) {
  var $ = cheerio.load(res.body);

  var links = $('.resource-list > li:nth-child(n + 3) > div > ul > li:nth-child(2) > a').map(function (link) {
    return $(this).attr('href');
  }).get();

  var size = 5*1024*1024;
  var prevText = '';

  function downloadNextFile (retryLink) {
    if (!links.length) {
      console.error('ALVARUNA!!!!!');
      return;
    }

    var link;

    if (retryLink) {
      link = retryLink;
    } else {
      link = links.pop();
    }

    var fileName = link.replace(/.*\/download\//gi, '');
    var out = fs.createWriteStream('downloads/' + fileName);
    var bar = new progbar.ProgressBar({
      filename: fileName,
      size: size
    });
    http.get(link).on('data', function (chunk) {
      bar.advance(chunk.length);
    }).on('end', function (err) {
      if (err) {
        console.log('Error, retrying in 5 seconds');
        setTimeout(function () {
          downloadNextFile(link);
        }, 5000);
      } else {
        bar.end();
        downloadNextFile();
      }
    }).pipe(out).on('finish', function () {
      console.log('Write complete.');
    });
  }

  downloadNextFile();
});
