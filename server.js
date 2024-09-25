const express=require('express')
const cors=require('cors')
const app=express()
app.use(express.json())

app.use(cors({
   origin: 'http://localhost:3005' // Allow requests from this origin
 }));



const {open}=require('sqlite');
const sqlite3=require('sqlite3');

const path=require('path');
const { request } = require('https');
const dbpath=path.join(__dirname,'todo.db');
let db

const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');


const initializeConnection=async ()=>{

try{
   db=await open({
      filename:dbpath,
      driver:sqlite3.Database
   })
   
   app.listen(3004,()=>{
      console.log('Server listening at http://localhost:3004');
      });
}
catch (e){
   console.log(`The error message is ${e}`);
}

}

initializeConnection()

app.post('/',async (request,response)=>{
   const {id,mailId,pswrd}=request.body 

   const hashedpassword=await bcrypt.hash(pswrd,10);

   const checkDb=`
     SELECT * FROM regUsers WHERE email='${mailId}';
   `

   const resCheck=await db.get(checkDb);

   if (resCheck===undefined){

      const insertQuery=`
        INSERT INTO regUsers(id,email,password)VALUES('${id}','${mailId}','${hashedpassword}');
      `
      await db.run(insertQuery);
      response.send('ok');

   }
   else{
      response.send('not ok')
   }
})


app.post('/login',async (request,response)=>{

   const {mailId1,pswrd1}=request.body

   const query=`
    SELECT * FROM regUsers WHERE email='${mailId1}';
   `

   const runLoginQuery=await db.get(query)

   if (runLoginQuery!==undefined){

      const cmppswd=await bcrypt.compare(pswrd1,runLoginQuery.password)

      if (cmppswd){

         const payload={
            userMail:mailId1
         }

         const jwtToken=jwt.sign(payload,'ASHRITHA')

         console.log(jwtToken)
         response.send({jwtToken})
      }
      else{
         response.status(401)
         response.send('not ok1')
      }

   }
   else{
      response.status(404)
      response.send('not ok2')
   }


})

const middleWear=(request,response,next)=>{

   const authHead=request.headers['authorization'];
   let jwt_token;
    
   if (authHead!==undefined){
      jwt_token=authHead.split(' ')[1]

      if (jwt_token!==undefined){
         jwt.verify(jwt_token,'ASHRITHA',(error,payload)=>{
            if (error){
               response.status(404)
               response.send('Invalid Jwt')
            }
            else{
               next()
            }
         })
      }
      else{
         response.status(404)
         response.send('Jwt not defined')
      }
   }else{
      response.status(404)
      response.send('Authorization header not provided')
   }
   
}


app.get('/todos',middleWear,async (request,response)=>{

   const query=`
   
     SELECT * FROM tasks;
   `
   const resQuery=await db.all(query)
   response.send(resQuery);
})


app.post('/todos',middleWear,async (request,response)=>{
    
   const {id,task,status}=request.body

   const query=`
      INSERT INTO tasks(id,task,status)
      VALUES('${id}','${task}',${status});
   `

   const resQuery=await db.run(query)
   console.log(resQuery);
   response.send('ok')

});

app.delete('/todos/:id',middleWear,async (request,response)=>{
   const {id}=request.params

   const query=`
      DELETE FROM tasks WHERE id='${id}';
   `
   await db.run(query);
   response.send('deleted')
})

app.put('/todos/:id',middleWear,async (request,response)=>{
   const {id}=request.params
   const {status}=request.body 

   const query=`
     UPDATE tasks SET status=${status} WHERE id='${id}';
   `

   await db.run(query)
   response.send('updated')
})