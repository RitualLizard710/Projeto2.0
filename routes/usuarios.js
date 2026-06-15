const express = require("express");
const router  = express.Router();
const bcrypt  = require("bcrypt");
const jwt     = require("jsonwebtoken");
const db      = require("../db");

// POST /api/usuarios/registrar
router.post("/registrar", async (req, res) => {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ erro: "Preencha todos os campos." });
    }

    try {
        const [existe] = await db.query("SELECT id FROM usuarios WHERE email = ?", [email]);
        if (existe.length > 0) {
            return res.status(409).json({ erro: "Email já cadastrado." });
        }

        const hash = await bcrypt.hash(senha, 10);
        await db.query("INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)", [nome, email, hash]);

        res.status(201).json({ mensagem: "Conta criada com sucesso!" });
    } catch (err) {
        res.status(500).json({ erro: "Erro ao registrar usuário." });
    }
});

// POST /api/usuarios/login
router.post("/login", async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ erro: "Preencha todos os campos." });
    }

    try {
        const [rows] = await db.query("SELECT * FROM usuarios WHERE email = ?", [email]);
        if (rows.length === 0) {
            return res.status(401).json({ erro: "Email ou senha inválidos." });
        }

        const usuario = rows[0];
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

        if (!senhaCorreta) {
            return res.status(401).json({ erro: "Email ou senha inválidos." });
        }

        const token = jwt.sign(
            { id: usuario.id, nome: usuario.nome, email: usuario.email },
            process.env.JWT_SECRET,
            { expiresIn: "8h" }
        );

        res.json({ token, nome: usuario.nome });
    } catch (err) {
        res.status(500).json({ erro: "Erro ao fazer login." });
    }
});

module.exports = router;
