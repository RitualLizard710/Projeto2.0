const express = require("express");
const router  = express.Router();
const db      = require("../db");
const auth    = require("../middleware/auth");

// GET /api/alunos — listar todos
router.get("/", auth, async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM alunos ORDER BY nome ASC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ erro: "Erro ao buscar alunos." });
    }
});

// GET /api/alunos/:id — buscar um
router.get("/:id", auth, async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM alunos WHERE id = ?", [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ erro: "Aluno não encontrado." });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ erro: "Erro ao buscar aluno." });
    }
});

// POST /api/alunos — cadastrar
router.post("/", auth, async (req, res) => {
    const { nome, email, telefone, nivel, observacoes } = req.body;

    if (!nome || !email) {
        return res.status(400).json({ erro: "Nome e email são obrigatórios." });
    }

    try {
        const [existe] = await db.query("SELECT id FROM alunos WHERE email = ?", [email]);
        if (existe.length > 0) {
            return res.status(409).json({ erro: "Email já cadastrado para outro aluno." });
        }

        const [result] = await db.query(
            "INSERT INTO alunos (nome, email, telefone, nivel, observacoes) VALUES (?, ?, ?, ?, ?)",
            [nome, email, telefone || null, nivel || "Básico", observacoes || null]
        );

        res.status(201).json({ id: result.insertId, mensagem: "Aluno cadastrado com sucesso!" });
    } catch (err) {
        res.status(500).json({ erro: "Erro ao cadastrar aluno." });
    }
});

// PUT /api/alunos/:id — editar
router.put("/:id", auth, async (req, res) => {
    const { nome, email, telefone, nivel, observacoes } = req.body;

    if (!nome || !email) {
        return res.status(400).json({ erro: "Nome e email são obrigatórios." });
    }

    try {
        const [result] = await db.query(
            "UPDATE alunos SET nome=?, email=?, telefone=?, nivel=?, observacoes=? WHERE id=?",
            [nome, email, telefone || null, nivel || "Básico", observacoes || null, req.params.id]
        );

        if (result.affectedRows === 0) return res.status(404).json({ erro: "Aluno não encontrado." });

        res.json({ mensagem: "Aluno atualizado com sucesso!" });
    } catch (err) {
        res.status(500).json({ erro: "Erro ao atualizar aluno." });
    }
});

// DELETE /api/alunos/:id — excluir
router.delete("/:id", auth, async (req, res) => {
    try {
        const [result] = await db.query("DELETE FROM alunos WHERE id = ?", [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ erro: "Aluno não encontrado." });
        res.json({ mensagem: "Aluno excluído com sucesso!" });
    } catch (err) {
        res.status(500).json({ erro: "Erro ao excluir aluno." });
    }
});

module.exports = router;
