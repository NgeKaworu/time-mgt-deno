// bash 执行
// mongo localhost:27017/time-mgt ./createIndex.js

// 初始化user表
db.getCollection("t_user").createIndex({ email: 1 }, { unique: true });
db.getCollection("t_user").createIndex({ name: 1 });

// 初始化tag表

db.getCollection("t_tag").createIndexes([{ name: 1 }, { uid: 1 }]);
db.getCollection("t_tag").createIndex({ name: 1, uid: 1 }, { unique: true });

// 初始化record表
db.getCollection("t_record").createIndexes([{ uid: 1 }, { tid: 1 }]);
