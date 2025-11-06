require("dotenv").config()
const jwt = require ("jsonwebtoken")
const bcrypt = require("bcrypt")
const express = require ("express")
const db = require("better-sqlite3") ("ourApp.db")
db.pragma("journal_mode = WAL ")

//database format
const createTables = db.transaction(() => {
db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    username STRING NOT NULL UNIQUE,
    password STRING NOT NULL
    )
    `).run()
})

createTables()

//ends
const app = express()

app.set("view engine", "ejs")
app.use(express.urlencoded({extended: false})) //this enables us to see the req.body command
app.use(express.static("public"))

app.use(function (req, res, next){ //middleware. a way to add a step in between before continuing
    res.locals.errors = []
    next()
})

app.get("/", (req, res) => {
    res.render("homepage")})

app.get("/login", (req, res) => {
    res.render("login")})

app.post("/register", (req, res) => {
    const errors = []

    if(typeof req.body.username !=="string") req.body.username = ""
    if(typeof req.body.password !=="string") req.body.password = ""

    req.body.username = req.body.username.trim()

    if(!req.body.username) errors.push("Username cannot be empty!") 
    if(req.body.username && req.body.username.length < 3) errors.push("Username must be at least 3 characters long!")
    if(req.body.username && req.body.username.length > 10) errors.push("Username cannot be more than 10 characters long!")
    if(req.body.username && !req.body.username.match(/^[a-zA-Z0-9]+$/)) errors.push("Username can only contain letters and numbers!")

    if(!req.body.password) errors.push("password cannot be empty!") 
    if(req.body.password && req.body.password.length < 6) errors.push("Password must be at least 6 characters long!")
    if(req.body.password && req.body.password.length > 30) errors.push("Password cannot be more than 30 characters long!")
    
    if(errors.length){
        return res.render("homepage", {errors})
    } 
    
    //save a new user into a database
    const salt = bcrypt.genSaltSync(10)
    req.body.password = bcrypt.hashSync(req.body.password, salt)

    const myStatement = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)")
    const result = myStatement.run(req.body.username, req.body.password)

    const lookupStatement = db.prepare("SELECT * FROM users WHERE ROWID = ?")
    const Users = lookupStatement.get(result.lastInsertRowid)

    //log in and give them cookie
    const tokenValue = jwt.sign({exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, skyColor: "blue", userid: Users.id, username: Users.username}, process.env.JWTSECRET)

    res.cookie("Simple_app", tokenValue, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24
    })

    res.send("Thank you")

    })

app.listen(3000)