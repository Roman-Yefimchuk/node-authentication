IF exist local_db (
"C:\Program Files\MongoDB 2.6 Standard\bin\mongod.exe" --dbpath "D:\node-authentication\local_db"
) ELSE ( 
mkdir local_db 
"C:\Program Files\MongoDB 2.6 Standard\bin\mongod.exe" --dbpath "D:\node-authentication\local_db"
)