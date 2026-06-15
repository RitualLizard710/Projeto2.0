const express = require("express");
const router  = express.Router();
const db      = require("../db");
const auth    = require("../middleware/auth");

// GET /api/cursos
router.get("/", auth, async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM cursos ORDER BY nome ASC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ erro: "Erro ao buscar cursos." });
    }
});

// GET /api/cursos/:id
router.get("/:id", auth, async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM cursos WHERE id = ?", [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ erro: "Curso não encontrado." });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ erro: "Erro ao buscar curso." });
    }
});

// POST /api/cursos
router.post("/", auth, async (req, res) => {
    const { nome, nivel, vagas_totais, carga_horaria, descricao } = req.body;

    if (!nome || !vagas_totais) {
        return res.status(400).json({ erro: "Nome e vagas são obrigatórios." });
    }

    if (vagas_totais <= 0) {
        return res.status(400).json({ erro: "A quantidade de vagas deve ser maior que zero." });
    }

    try {
        const [result] = await db.query(
            "INSERT INTO cursos (nome, nivel, vagas_totais, carga_horaria, descricao) VALUES (?, ?, ?, ?, ?)",
            [nome, nivel || "Básico", vagas_totais, carga_horaria || null, descricao || null]
        );
        res.status(201).json({ id: result.insertId, mensagem: "Curso cadastrado com sucesso!" });
    } catch (err) {
        res.status(500).json({ erro: "Erro ao cadastrar curso." });
    }
});

// PUT /api/cursos/:id
router.put("/:id", auth, async (req, res) => {
    const { nome, nivel, vagas_totais, carga_horaria, descricao } = req.body;

    if (!nome || !vagas_totais) {
        return res.status(400).json({ erro: "Nome e vagas são obrigatórios." });
    }

    try {
        // Verifica se novas vagas são menores que vagas já ocupadas
        const [rows] = await db.query("SELECT vagas_ocupadas FROM cursos WHERE id = ?", [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ erro: "Curso não encontrado." });

        if (vagas_totais < rows[0].vagas_ocupadas) {
            return res.status(400).json({ erro: "Vagas totais não podem ser menores que as vagas já ocupadas." });
        }

        await db.query(
            "UPDATE cursos SET nome=?, nivel=?, vagas_totais=?, carga_horaria=?, descricao=? WHERE id=?",
            [nome, nivel || "Básico", vagas_totais, carga_horaria || null, descricao || null, req.params.id]
        );

        res.json({ mensagem: "Curso atualizado com sucesso!" });
    } catch (err) {
        res.status(500).json({ erro: "Erro ao atualizar curso." });
    }
});

// DELETE /api/cursos/:id
router.delete("/:id", auth, async (req, res) => {
    try {
        const [result] = await db.query("DELETE FROM cursos WHERE id = ?", [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ erro: "Curso não encontrado." });
        res.json({ mensagem: "Curso excluído com sucesso!" });
    } catch (err) {
        res.status(500).json({ erro: "Erro ao excluir curso." });
    }
});

module.exports = router;
