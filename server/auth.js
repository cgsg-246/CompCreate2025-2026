import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-me';
const USERS_FILE = path.join(__dirname, 'data', 'users.json');

function readUsers() {
    if (!fs.existsSync(USERS_FILE)) return {};
    try {
        return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    } catch {
        return {};
    }
}

function writeUsers(users) {
    const dir = path.dirname(USERS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

export function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Токен не предоставлен' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userEmail = decoded.email;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Неверный или просроченный токен' });
    }
}

export function generateToken(email) {
    return jwt.sign({ email }, JWT_SECRET, { expiresIn: '7d' });
}

export async function hashPassword(password) {
    return await bcrypt.hash(password, 10);
}

export async function comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

export function getUser(email) {
    const users = readUsers();
    return users[email] || null;
}

export function createUser(email, hashedPassword) {
    const users = readUsers();
    if (users[email]) {
        throw new Error('Пользователь с таким email уже существует');
    }
    users[email] = {
        email,
        password: hashedPassword,
        build: null
    };
    writeUsers(users);
    return users[email];
}

export function updateUserBuild(email, build) {
    const users = readUsers();
    if (!users[email]) {
        throw new Error('Пользователь не найден');
    }
    users[email].build = build;
    writeUsers(users);
}