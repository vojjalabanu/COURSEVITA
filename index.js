const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const app = express();
mongoose.connect("mongodb+srv://user:user1234@cluster0.eu2y8.mongodb.net/database");

const JWT_SECRET = "123"; 

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const User = mongoose.model('UserCredential', userSchema);

app.use(express.json());

app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    try {
        const findIfExists = await User.findOne({ username });
        if (findIfExists) {
            return res.status(400).send("Username is already used.");
        }
        const user = new User({ username, password });
        await user.save();
        res.send('User Created Successfully.');
    } catch (err) {
        if (err.code === 11000) {
            res.status(400).send("Username is already used.");
        } else {
            res.status(500).send(err);
        }
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        console.log(username+" "+password);
        const user = await User.findOne({ username });
        if (!user || user.password !== password) {
            return res.status(401).send("false");
        }
        const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ message: "true", token });
    } catch (err) {
        res.status(500).send("false");
    }
});

const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).send("Access Denied");

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).send("Invalid Token");
        req.user = user;
        next();
    });
};

app.post('/logout', authenticateToken, (req, res) => {
    res.json({ message: "Logged out successfully" });
});

app.get('/protected', authenticateToken, (req, res) => {
    res.json({ message: "This is a protected route", user: req.user });
});

app.listen(9999, () => {
    console.log("Server is running on port 9999");
});
