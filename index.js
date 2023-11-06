import express from 'express';
import cors from 'cors';
import 'dotenv/config'

// create express instance 
const app = express()
const port = process.env.PORT || 5000;

// middleware 
app.use(cors())
app.use(express.json())

// testing api 
app.get('/', (req, res)=>{
    res.send('skill waves server is running well')
})

app.listen(port, ()=>{
    console.log(`skill waves server is running on port: ${port}`);
})