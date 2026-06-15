const express = require("express");
const router  = express.Router();
const db      = require("../db");
const auth    = require("../middleware/auth");

// GET /api/atendimentos
router.get("/", auth, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT at.id, at.data_atendimento, at.horario, at.motivo, at.status,
                   a.id AS aluno_id, a.nome AS aluno_nome
            FROM atendimentos at
            JOIN alunos a ON a.id = at.aluno_id
            ORDER BY at.data_atendimento ASC, at.horario ASC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ erro: "Erro ao buscar atendimentos." });
    }
});

// POST /api/atendimentos
router.post("/", auth, async (req, res) => {
    const { aluno_id, data_atendimento, horario, motivo, status } = req.body;

    if (!aluno_id || !data_atendimento || !horario) {
        return res.status(400).json({ erro: "Aluno, data e horário são obrigatórios." });
    }

    try {
        const [result] = await db.query(
            "INSERT INTO atendimentos (aluno_id, data_atendimento, horario, motivo, status) VALUES (?, ?, ?, ?, ?)",
            [aluno_id, data_atendimento, horario, motivo || null, status || "Agendado"]
        );
        res.status(201).json({ id: result.insertId, mensagem: "Atendimento agendado com sucesso!" });
    } catch (err) {
        res.status(500).json({ erro: "Erro ao agendar atendimento." });
    }
});

// PUT /api/atendimentos/:id
router.put("/:id", auth, async (req, res) => {
    const { aluno_id, data_atendimento, horario, motivo, status } = req.body;

    try {
        const [result] = await db.query(
            "UPDATE atendimentos SET aluno_id=?, data_atendimento=?, horario=?, motivo=?, status=? WHERE id=?",
            [aluno_id, data_atendimento, horario, motivo || null, status || "Agendado", req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ erro: "Atendimento não encontrado." });
        res.json({ mensagem: "Atendimento atualizado com sucesso!" });
    } catch (err) {
        res.status(500).json({ erro: "Erro ao atualizar atendimento." });
    }
});

// DELETE /api/atendimentos/:id
router.delete("/:id", auth, async (req, res) => {
    try {
        const [result] = await db.query("DELETE FROM atendimentos WHERE id = ?", [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ erro: "Atendimento não encontrado." });
        res.json({ mensagem: "Atendimento excluído com sucesso!" });
    } catch (err) {
        res.status(500).json({ erro: "Erro ao excluir atendimento." });
    }
});

module.exports = router;
