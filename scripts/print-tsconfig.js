const fs = require("fs");
console.log("Reading tsconfig from:", process.cwd());
console.log(fs.existsSync("./tsconfig.json") ? "tsconfig FOUND" : "tsconfig NOT FOUND");