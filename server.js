require("dotenv").config();

const express = require("express");
const cors    = require("cors");
const path    = require("path");

const app = express();

// ============================================================
// MIDDLEWARES
// ============================================================
app.use(cors());
app.use(express.json());

// Serve os arquivos estáticos do front-end (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "public")));

// ============================================================
// ROTAS DA API
// ============================================================
app.use("/api/usuarios",     require("./routes/usuarios"));
app.use("/api/alunos",       require("./routes/alunos"));
app.use("/api/cursos",       require("./routes/cursos"));
app.use("/api/matriculas",   require("./routes/matriculas"));
app.use("/api/atendimentos", require("./routes/atendimentos"));
app.use("/api/dashboard",    require("./routes/dashboard"));

// ============================================================
// ROTA PRINCIPAL — envia o index.html para qualquer outra rota
// ============================================================
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ============================================================
// INICIA O SERVIDOR
// ============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
