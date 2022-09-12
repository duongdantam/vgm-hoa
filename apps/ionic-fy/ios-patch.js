const fs = require('fs');
const appBoundDomain = 'ios/App/App/Info.plist';
fs.readFile(appBoundDomain, 'utf8', function (err, data) {
  if (err) {
    return console.log(err);
  }
  var result = data.replace(
    /(\<dict\>)/,
    `<dict>
    <key>WKAppBoundDomains</key>
    <array>
    <string>localhost</string>
    <string>fy.tv</string>
    <string>cdn.fy.tv</string>
    </array>`
  );

  fs.writeFile(appBoundDomain, result, 'utf8', function (err) {
    if (err) return console.log(err);
  });
});
