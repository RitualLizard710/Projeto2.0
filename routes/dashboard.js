const express = require("express");
const router  = express.Router();
const db      = require("../db");
const auth    = require("../middleware/auth");

// GET /api/dashboard
router.get("/", auth, async (req, res) => {
    try {
        const [[{ totalAlunos }]]       = await db.query("SELECT COUNT(*) AS totalAlunos FROM alunos");
        const [[{ totalCursos }]]       = await db.query("SELECT COUNT(*) AS totalCursos FROM cursos");
        const [[{ totalMatriculas }]]   = await db.query("SELECT COUNT(*) AS totalMatriculas FROM matriculas WHERE status = 'Ativa'");
        const [[{ totalAgendados }]]    = await db.query("SELECT COUNT(*) AS totalAgendados FROM atendimentos WHERE status = 'Agendado'");

        const [proximosAtendimentos] = await db.query(`
            SELECT at.data_atendimento, at.horario, at.status, a.nome AS aluno_nome
            FROM atendimentos at
            JOIN alunos a ON a.id = at.aluno_id
            WHERE at.status = 'Agendado' AND at.data_atendimento >= CURDATE()
            ORDER BY at.data_atendimento ASC, at.horario ASC
            LIMIT 5
        `);

        res.json({
            totalAlunos,
            totalCursos,
            totalMatriculas,
            totalAgendados,
            proximosAtendimentos
        });
    } catch (err) {
        res.status(500).json({ erro: "Erro ao carregar dashboard." });
    }
});

module.exports = router;
