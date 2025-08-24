import bcrypt from "bcrypt";
const hash = await bcrypt.hash("visionfest123", 10);
console.log(hash);
