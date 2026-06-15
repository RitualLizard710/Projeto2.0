const express = require("express");
const router  = express.Router();
const db      = require("../db");
const auth    = require("../middleware/auth");

// GET /api/matriculas — listar com JOIN para pegar nomes
router.get("/", auth, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT m.id, m.data_matricula, m.status,
                   a.id AS aluno_id, a.nome AS aluno_nome,
                   c.id AS curso_id, c.nome AS curso_nome
            FROM matriculas m
            JOIN alunos a ON a.id = m.aluno_id
            JOIN cursos c ON c.id = m.curso_id
            ORDER BY m.criado_em DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ erro: "Erro ao buscar matrículas." });
    }
});

// POST /api/matriculas — nova matrícula
router.post("/", auth, async (req, res) => {
    const { aluno_id, curso_id, data_matricula } = req.body;

    if (!aluno_id || !curso_id || !data_matricula) {
        return res.status(400).json({ erro: "Aluno, curso e data são obrigatórios." });
    }

    try {
        // Verifica se curso tem vagas
        const [cursoRows] = await db.query("SELECT * FROM cursos WHERE id = ?", [curso_id]);
        if (cursoRows.length === 0) return res.status(404).json({ erro: "Curso não encontrado." });

        const curso = cursoRows[0];
        if (curso.vagas_ocupadas >= curso.vagas_totais) {
            return res.status(400).json({ erro: "Curso lotado. Não há vagas disponíveis." });
        }

        // Verifica se aluno já está matriculado neste curso
        const [jaMatriculado] = await db.query(
            "SELECT id FROM matriculas WHERE aluno_id = ? AND curso_id = ? AND status = 'Ativa'",
            [aluno_id, curso_id]
        );
        if (jaMatriculado.length > 0) {
            return res.status(409).json({ erro: "Aluno já está matriculado neste curso." });
        }

        // Cria matrícula e incrementa vagas em transação
        await db.query("START TRANSACTION");
        await db.query(
            "INSERT INTO matriculas (aluno_id, curso_id, data_matricula) VALUES (?, ?, ?)",
            [aluno_id, curso_id, data_matricula]
        );
        await db.query("UPDATE cursos SET vagas_ocupadas = vagas_ocupadas + 1 WHERE id = ?", [curso_id]);
        await db.query("COMMIT");

        res.status(201).json({ mensagem: "Matrícula realizada com sucesso!" });
    } catch (err) {
        await db.query("ROLLBACK");
        res.status(500).json({ erro: "Erro ao realizar matrícula." });
    }
});

// PUT /api/matriculas/:id — editar (trocar curso ou data)
router.put("/:id", auth, async (req, res) => {
    const { curso_id, data_matricula } = req.body;

    try {
        const [matriculaRows] = await db.query("SELECT * FROM matriculas WHERE id = ?", [req.params.id]);
        if (matriculaRows.length === 0) return res.status(404).json({ erro: "Matrícula não encontrada." });

        const matricula = matriculaRows[0];

        // Se trocou de curso, verifica vagas no novo e decrementa o antigo
        if (curso_id && curso_id !== matricula.curso_id) {
            const [novoCursoRows] = await db.query("SELECT * FROM cursos WHERE id = ?", [curso_id]);
            if (novoCursoRows.length === 0) return res.status(404).json({ erro: "Novo curso não encontrado." });

            const novoCurso = novoCursoRows[0];
            if (novoCurso.vagas_ocupadas >= novoCurso.vagas_totais) {
                return res.status(400).json({ erro: "Novo curso está lotado." });
            }

            await db.query("START TRANSACTION");
            await db.query("UPDATE cursos SET vagas_ocupadas = vagas_ocupadas - 1 WHERE id = ?", [matricula.curso_id]);
            await db.query("UPDATE cursos SET vagas_ocupadas = vagas_ocupadas + 1 WHERE id = ?", [curso_id]);
            await db.query(
                "UPDATE matriculas SET curso_id=?, data_matricula=? WHERE id=?",
                [curso_id, data_matricula, req.params.id]
            );
            await db.query("COMMIT");
        } else {
            await db.query("UPDATE matriculas SET data_matricula=? WHERE id=?", [data_matricula, req.params.id]);
        }

        res.json({ mensagem: "Matrícula atualizada com sucesso!" });
    } catch (err) {
        await db.query("ROLLBACK");
        res.status(500).json({ erro: "Erro ao atualizar matrícula." });
    }
});

// DELETE /api/matriculas/:id — cancelar e liberar vaga
router.delete("/:id", auth, async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM matriculas WHERE id = ?", [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ erro: "Matrícula não encontrada." });

        await db.query("START TRANSACTION");
        await db.query("UPDATE cursos SET vagas_ocupadas = vagas_ocupadas - 1 WHERE id = ?", [rows[0].curso_id]);
        await db.query("DELETE FROM matriculas WHERE id = ?", [req.params.id]);
        await db.query("COMMIT");

        res.json({ mensagem: "Matrícula cancelada com sucesso!" });
    } catch (err) {
        await db.query("ROLLBACK");
        res.status(500).json({ erro: "Erro ao cancelar matrícula." });
    }
});

module.exports = router;
