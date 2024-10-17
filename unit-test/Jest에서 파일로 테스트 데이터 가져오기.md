```js
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "./", "bla.txt");
const fdr = fs.readFileSync(file, "utf8", function(err: any, data: any) {
  return data;
});

expect(string).toBe(fdr)
```

https://stackoverflow.com/questions/53851171/jest-loading-text-files-for-string-assertions
