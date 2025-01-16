module.exports = {
  "PORT": process.env.PORT || 3000,
  "LOG_LEVEL": process.env.LOG_LEVEL || "debug",
  "CONNECTION_STRING": process.env.CONNECTION_STRING,
  "JWT": {
    "SECRET": "TEST",
    "EXPIRE_TIME": !isNaN(parseInt(process.env.TOKEN_EXPIRE_TIME)) ? parseInt(process.env.TOKEN_EXPIRE_TIME) : 24 * 60 * 60,
  },
  "FILE_UPLOAD_PATH": process.env.FILE_UPLOAD_PATH,
  "DEFAULT_LANG": process.env.DEFAULT_LANG || "EN",
};
