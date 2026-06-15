// ============================================================
// CONFIGURAÇÃO DA API
// ============================================================

const API = "https://reforco-escolar-wr7m.onrender.com/api";

// Token JWT salvo após login
let tokenJWT = localStorage.getItem("token") || null;
let nomeUsuario = localStorage.getItem("nomeUsuario") || "";

// Cabeçalho padrão com token para todas as requisições autenticadas
function headersAuth() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${tokenJWT}`
    };
}

// Função genérica para chamadas à API
async function api(metodo, rota, corpo = null) {
    const opcoes = {
        method: metodo,
        headers: headersAuth()
    };
    if (corpo) opcoes.body = JSON.stringify(corpo);

    const resposta = await fetch(`${API}${rota}`, opcoes);
    const dados = await resposta.json();

    if (!resposta.ok) {
        throw new Error(dados.erro || "Erro na requisição.");
    }
    return dados;
}

// ============================================================
// HELPERS
// ============================================================

function obterValor(id) {
    return document.getElementById(id)?.value || "";
}

function renderizarConteudo(html) {
    document.getElementById("conteudo").innerHTML = html;
}

function classNivel(nivel) {
    const mapa = { "Intermediário": "intermediario", "Avançado": "avancado" };
    return mapa[nivel] || "basico";
}

function botoesAcao(onEditar, onExcluir) {
    return `
        <div class="acoes-tabela">
            <button class="botao-icone editar" onclick="${onEditar}">
                <i class="fa-solid fa-pen"></i>
            </button>
            <button class="botao-icone excluir" onclick="${onExcluir}">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `;
}

function mostrarMensagem(texto, tipo = "sucesso") {
    const el = document.getElementById("mensagemFlutuante");
    if (!el) return;
    el.textContent = texto;
    el.style.display = "block";
    el.style.background = tipo === "erro" ? "#be123c" : "#111827";
    setTimeout(() => { el.style.display = "none"; }, 3000);
}

// ============================================================
// AUTENTICAÇÃO
// ============================================================

async function entrar() {
    const email = obterValor("emailLogin");
    const senha = obterValor("senhaLogin");

    try {
        const dados = await fetch(`${API}/usuarios/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha })
        });
        const resposta = await dados.json();

        if (!dados.ok) {
            alert(resposta.erro || "Email ou senha inválidos.");
            return;
        }

        tokenJWT = resposta.token;
        nomeUsuario = resposta.nome;
        localStorage.setItem("token", tokenJWT);
        localStorage.setItem("nomeUsuario", nomeUsuario);

        document.getElementById("nomeUsuarioTopo").textContent = nomeUsuario;
        document.getElementById("telaLogin").classList.add("oculto");
        document.getElementById("aplicacao").classList.remove("oculto");

        carregarDashboard();
    } catch (err) {
        alert("Erro ao conectar com o servidor.");
    }
}

async function registrar() {
    const nome  = obterValor("nomeCadastro");
    const email = obterValor("emailCadastro");
    const senha = obterValor("senhaCadastro");

    if (!nome || !email || !senha) {
        alert("Preencha todos os campos.");
        return;
    }

    try {
        const dados = await fetch(`${API}/usuarios/registrar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome, email, senha })
        });
        const resposta = await dados.json();

        if (!dados.ok) {
            alert(resposta.erro || "Erro ao registrar.");
            return;
        }

        alert("Conta criada com sucesso! Faça login.");
        voltarLogin();
    } catch (err) {
        alert("Erro ao conectar com o servidor.");
    }
}

function abrirRegistro() {
    document.getElementById("telaLogin").classList.add("oculto");
    document.getElementById("telaRegistro").classList.remove("oculto");
}

function voltarLogin() {
    document.getElementById("telaRegistro").classList.add("oculto");
    document.getElementById("telaLogin").classList.remove("oculto");
}

function sair() {
    tokenJWT = null;
    localStorage.removeItem("token");
    localStorage.removeItem("nomeUsuario");
    document.getElementById("aplicacao").classList.add("oculto");
    document.getElementById("telaLogin").classList.remove("oculto");
}

// Verifica se já está logado ao carregar a página
window.addEventListener("load", () => {
    if (tokenJWT) {
        document.getElementById("nomeUsuarioTopo").textContent = nomeUsuario;
        document.getElementById("telaLogin").classList.add("oculto");
        document.getElementById("aplicacao").classList.remove("oculto");
        carregarDashboard();
    }
});

// ============================================================
// MENU / NAVEGAÇÃO
// ============================================================

function ativarMenu(idMenu) {
    document.querySelectorAll(".item-menu").forEach(m => m.classList.remove("ativo"));
    document.getElementById(idMenu).classList.add("ativo");
}

function mostrarInicio() { carregarDashboard(); }

// ============================================================
// DASHBOARD
// ============================================================

async function carregarDashboard() {
    try {
        const dados = await api("GET", "/dashboard");

        const linhasProximos = dados.proximosAtendimentos.length
            ? dados.proximosAtendimentos.map(a => `
                <tr>
                    <td>${a.aluno_nome}</td>
                    <td>${formatarData(a.data_atendimento)}</td>
                    <td>${a.horario}</td>
                </tr>
            `).join("")
            : `<tr><td colspan="3" class="estado-vazio">Nenhum atendimento agendado.</td></tr>`;

        renderizarConteudo(`
            <h1>Dashboard</h1>
            <p class="subtitulo">Visão geral do sistema.</p>

            <div class="grade-cards">
                <div class="card-info">
                    <i class="fa-solid fa-user-graduate fa-2x"></i>
                    <div class="numero-card">${dados.totalAlunos}</div>
                    <div class="texto-card">Total de Alunos</div>
                </div>
                <div class="card-info">
                    <i class="fa-solid fa-book fa-2x"></i>
                    <div class="numero-card">${dados.totalCursos}</div>
                    <div class="texto-card">Total de Cursos</div>
                </div>
                <div class="card-info">
                    <i class="fa-solid fa-clipboard-list fa-2x"></i>
                    <div class="numero-card">${dados.totalMatriculas}</div>
                    <div class="texto-card">Matrículas Ativas</div>
                </div>
                <div class="card-info">
                    <i class="fa-solid fa-calendar-days fa-2x"></i>
                    <div class="numero-card">${dados.totalAgendados}</div>
                    <div class="texto-card">Atendimentos Agendados</div>
                </div>
            </div>

            <h2 class="titulo-rapido">Ações Rápidas</h2>
            <div class="grade-acoes">
                <button class="botao-azul" onclick="abrirCadastroAluno()">Cadastrar Aluno</button>
                <button class="botao-azul" onclick="abrirCadastroCurso()">Criar Curso</button>
                <button class="botao-azul" onclick="abrirMatricula()">Nova Matrícula</button>
                <button class="botao-azul" onclick="abrirAtendimento()">Agendar Atendimento</button>
            </div>

            <div class="painel">
                <div class="cabecalho-painel">Próximos Atendimentos</div>
                <table>
                    <thead>
                        <tr><th>Aluno</th><th>Data</th><th>Horário</th></tr>
                    </thead>
                    <tbody>${linhasProximos}</tbody>
                </table>
            </div>
        `);
    } catch (err) {
        renderizarConteudo(`<p style="color:red">Erro ao carregar dashboard: ${err.message}</p>`);
    }
}

// ============================================================
// UTILITÁRIOS DE DATA
// ============================================================

function formatarData(dataISO) {
    if (!dataISO) return "";
    const [ano, mes, dia] = dataISO.split("T")[0].split("-");
    return `${dia}/${mes}/${ano}`;
}

function dataParaInput(dataISO) {
    return dataISO ? dataISO.split("T")[0] : "";
}

// ============================================================
// ALUNOS
// ============================================================

async function mostrarAlunos() {
    try {
        const alunos = await api("GET", "/alunos");

        const linhas = alunos.length
            ? alunos.map(aluno => `
                <tr>
                    <td>${aluno.nome}</td>
                    <td>${aluno.email}</td>
                    <td>${aluno.telefone || "-"}</td>
                    <td><span class="etiqueta ${classNivel(aluno.nivel)}">${aluno.nivel}</span></td>
                    <td>${botoesAcao(`editarAluno(${aluno.id})`, `excluirAluno(${aluno.id})`)}</td>
                </tr>
            `).join("")
            : `<tr><td colspan="5" class="estado-vazio">Nenhum aluno cadastrado.</td></tr>`;

        renderizarConteudo(`
            <h1>Alunos</h1>
            <p class="subtitulo">Gerenciamento de alunos cadastrados.</p>

            <div class="card-filtros">
                <div class="campo-busca">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" id="buscaAluno" placeholder="Buscar aluno" onkeyup="filtrarTabela('buscaAluno', 'tabelaAlunos')">
                </div>
                <select id="filtroNivelAluno" onchange="filtrarAlunos()">
                    <option value="Todos">Todos os níveis</option>
                    <option value="Básico">Básico</option>
                    <option value="Intermediário">Intermediário</option>
                    <option value="Avançado">Avançado</option>
                </select>
                <button class="botao-azul" onclick="abrirCadastroAluno()">Cadastrar Aluno</button>
            </div>

            <div class="card-tabela">
                <table id="tabelaAlunos">
                    <thead>
                        <tr><th>Nome</th><th>Email</th><th>Telefone</th><th>Nível</th><th>Ações</th></tr>
                    </thead>
                    <tbody>${linhas}</tbody>
                </table>
            </div>
        `);
    } catch (err) {
        mostrarMensagem("Erro ao carregar alunos.", "erro");
    }
}

function abrirCadastroAluno() {
    renderizarConteudo(`
        <h1>Cadastrar Aluno</h1>
        <p class="subtitulo">Preencha os dados do aluno.</p>

        <div class="card-formulario">
            <div class="grade-formulario">
                <div>
                    <label>Nome Completo <span class="obrigatorio">*</span></label>
                    <input type="text" id="nomeAluno">
                </div>
                <div>
                    <label>Email <span class="obrigatorio">*</span></label>
                    <input type="email" id="emailAluno">
                </div>
                <div>
                    <label>Telefone</label>
                    <input type="text" id="telefoneAluno" placeholder="71 999999999">
                </div>
                <div>
                    <label>Nível</label>
                    <select id="nivelAluno">
                        <option>Básico</option>
                        <option>Intermediário</option>
                        <option>Avançado</option>
                    </select>
                </div>
                <div class="linha-inteira">
                    <label>Observações</label>
                    <textarea id="observacoesAluno"></textarea>
                </div>
            </div>
            <div class="acoes-formulario">
                <button class="botao-cinza" onclick="mostrarAlunos()">Cancelar</button>
                <button class="botao-azul"  onclick="salvarAluno()">Salvar</button>
            </div>
        </div>
    `);
}

async function salvarAluno() {
    const nome        = obterValor("nomeAluno");
    const email       = obterValor("emailAluno");
    const telefone    = obterValor("telefoneAluno");
    const nivel       = obterValor("nivelAluno");
    const observacoes = obterValor("observacoesAluno");

    if (!nome || !email) {
        alert("Nome e Email são obrigatórios.");
        return;
    }

    try {
        await api("POST", "/alunos", { nome, email, telefone, nivel, observacoes });
        mostrarMensagem("Aluno cadastrado com sucesso!");
        ativarMenu("menuAlunos");
        mostrarAlunos();
    } catch (err) {
        alert(err.message);
    }
}

async function editarAluno(id) {
    try {
        const aluno = await api("GET", `/alunos/${id}`);

        renderizarConteudo(`
            <h1>Editar Aluno</h1>
            <p class="subtitulo">Atualize os dados do aluno.</p>

            <div class="card-formulario">
                <div class="grade-formulario">
                    <div>
                        <label>Nome Completo *</label>
                        <input type="text" id="nomeAluno" value="${aluno.nome}">
                    </div>
                    <div>
                        <label>Email *</label>
                        <input type="email" id="emailAluno" value="${aluno.email}">
                    </div>
                    <div>
                        <label>Telefone</label>
                        <input type="text" id="telefoneAluno" value="${aluno.telefone || ""}">
                    </div>
                    <div>
                        <label>Nível</label>
                        <select id="nivelAluno">
                            <option ${aluno.nivel === "Básico"        ? "selected" : ""}>Básico</option>
                            <option ${aluno.nivel === "Intermediário" ? "selected" : ""}>Intermediário</option>
                            <option ${aluno.nivel === "Avançado"      ? "selected" : ""}>Avançado</option>
                        </select>
                    </div>
                    <div class="linha-inteira">
                        <label>Observações</label>
                        <textarea id="observacoesAluno">${aluno.observacoes || ""}</textarea>
                    </div>
                </div>
                <div class="acoes-formulario">
                    <button class="botao-cinza" onclick="mostrarAlunos()">Cancelar</button>
                    <button class="botao-azul"  onclick="salvarEdicaoAluno(${id})">Salvar Alterações</button>
                </div>
            </div>
        `);
    } catch (err) {
        alert("Erro ao carregar aluno.");
    }
}

async function salvarEdicaoAluno(id) {
    const nome        = obterValor("nomeAluno");
    const email       = obterValor("emailAluno");
    const telefone    = obterValor("telefoneAluno");
    const nivel       = obterValor("nivelAluno");
    const observacoes = obterValor("observacoesAluno");

    try {
        await api("PUT", `/alunos/${id}`, { nome, email, telefone, nivel, observacoes });
        mostrarMensagem("Aluno atualizado com sucesso!");
        mostrarAlunos();
    } catch (err) {
        alert(err.message);
    }
}

async function excluirAluno(id) {
    if (!confirm("Deseja excluir este aluno?")) return;
    try {
        await api("DELETE", `/alunos/${id}`);
        mostrarMensagem("Aluno excluído.");
        mostrarAlunos();
    } catch (err) {
        alert(err.message);
    }
}

// ============================================================
// CURSOS
// ============================================================

async function mostrarCursos() {
    try {
        const cursos = await api("GET", "/cursos");

        const linhas = cursos.length
            ? cursos.map(curso => {
                const lotado = curso.vagas_ocupadas >= curso.vagas_totais;
                return `
                    <tr>
                        <td>${curso.nome}</td>
                        <td>${curso.nivel}</td>
                        <td>${curso.vagas_totais}</td>
                        <td>${curso.vagas_ocupadas}</td>
                        <td><span class="etiqueta ${lotado ? "lotado" : "disponivel"}">${lotado ? "Lotado" : "Disponível"}</span></td>
                        <td>${botoesAcao(`editarCurso(${curso.id})`, `excluirCurso(${curso.id})`)}</td>
                    </tr>
                `;
            }).join("")
            : `<tr><td colspan="6" class="estado-vazio">Nenhum curso cadastrado.</td></tr>`;

        renderizarConteudo(`
            <h1>Cursos</h1>
            <p class="subtitulo">Gerenciamento de cursos.</p>

            <div class="card-filtros">
                <div class="campo-busca">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" id="buscaCurso" placeholder="Buscar curso" onkeyup="filtrarTabela('buscaCurso', 'tabelaCursos')">
                </div>
                <select id="filtroStatusCurso" onchange="filtrarCursos()">
                    <option value="Todos">Todos</option>
                    <option value="Disponível">Disponível</option>
                    <option value="Lotado">Lotado</option>
                </select>
                <button class="botao-azul" onclick="abrirCadastroCurso()">Cadastrar Curso</button>
            </div>

            <div class="card-tabela">
                <table id="tabelaCursos">
                    <thead>
                        <tr><th>Curso</th><th>Nível</th><th>Vagas</th><th>Ocupadas</th><th>Status</th><th>Ações</th></tr>
                    </thead>
                    <tbody>${linhas}</tbody>
                </table>
            </div>
        `);
    } catch (err) {
        mostrarMensagem("Erro ao carregar cursos.", "erro");
    }
}

function abrirCadastroCurso() {
    renderizarConteudo(`
        <h1>Cadastrar Curso</h1>
        <p class="subtitulo">Cadastro de novo curso.</p>

        <div class="card-formulario">
            <div class="grade-formulario">
                <div>
                    <label>Nome do Curso <span class="obrigatorio">*</span></label>
                    <input type="text" id="nomeCurso">
                </div>
                <div>
                    <label>Nível <span class="obrigatorio">*</span></label>
                    <select id="nivelCurso">
                        <option>Básico</option>
                        <option>Intermediário</option>
                        <option>Avançado</option>
                    </select>
                </div>
                <div>
                    <label>Quantidade de Vagas <span class="obrigatorio">*</span></label>
                    <input type="number" id="vagasCurso" min="1">
                </div>
                <div>
                    <label>Carga Horária</label>
                    <input type="text" id="cargaCurso" placeholder="Ex: 40h">
                </div>
                <div class="linha-inteira">
                    <label>Descrição</label>
                    <textarea id="descricaoCurso"></textarea>
                </div>
            </div>
            <div class="acoes-formulario">
                <button class="botao-cinza" onclick="mostrarCursos()">Cancelar</button>
                <button class="botao-azul"  onclick="salvarCurso()">Salvar</button>
            </div>
        </div>
    `);
}

async function salvarCurso() {
    const nome          = obterValor("nomeCurso");
    const nivel         = obterValor("nivelCurso");
    const vagas_totais  = parseInt(obterValor("vagasCurso"));
    const carga_horaria = obterValor("cargaCurso");
    const descricao     = obterValor("descricaoCurso");

    if (!nome || isNaN(vagas_totais) || vagas_totais <= 0) {
        alert("Nome e vagas são obrigatórios.");
        return;
    }

    try {
        await api("POST", "/cursos", { nome, nivel, vagas_totais, carga_horaria, descricao });
        mostrarMensagem("Curso cadastrado com sucesso!");
        ativarMenu("menuCursos");
        mostrarCursos();
    } catch (err) {
        alert(err.message);
    }
}

async function editarCurso(id) {
    try {
        const curso = await api("GET", `/cursos/${id}`);

        renderizarConteudo(`
            <h1>Editar Curso</h1>
            <p class="subtitulo">Atualize os dados do curso.</p>

            <div class="card-formulario">
                <div class="grade-formulario">
                    <div>
                        <label>Nome do Curso *</label>
                        <input type="text" id="nomeCurso" value="${curso.nome}">
                    </div>
                    <div>
                        <label>Nível *</label>
                        <select id="nivelCurso">
                            <option ${curso.nivel === "Básico"        ? "selected" : ""}>Básico</option>
                            <option ${curso.nivel === "Intermediário" ? "selected" : ""}>Intermediário</option>
                            <option ${curso.nivel === "Avançado"      ? "selected" : ""}>Avançado</option>
                        </select>
                    </div>
                    <div>
                        <label>Quantidade de vagas *</label>
                        <input type="number" id="vagasCurso" value="${curso.vagas_totais}" min="1">
                    </div>
                    <div>
                        <label>Carga Horária</label>
                        <input type="text" id="cargaCurso" value="${curso.carga_horaria || ""}">
                    </div>
                    <div class="linha-inteira">
                        <label>Descrição</label>
                        <textarea id="descricaoCurso">${curso.descricao || ""}</textarea>
                    </div>
                </div>
                <div class="acoes-formulario">
                    <button class="botao-cinza" onclick="mostrarCursos()">Cancelar</button>
                    <button class="botao-azul"  onclick="salvarEdicaoCurso(${id})">Salvar Alterações</button>
                </div>
            </div>
        `);
    } catch (err) {
        alert("Erro ao carregar curso.");
    }
}

async function salvarEdicaoCurso(id) {
    const nome          = obterValor("nomeCurso");
    const nivel         = obterValor("nivelCurso");
    const vagas_totais  = parseInt(obterValor("vagasCurso"));
    const carga_horaria = obterValor("cargaCurso");
    const descricao     = obterValor("descricaoCurso");

    try {
        await api("PUT", `/cursos/${id}`, { nome, nivel, vagas_totais, carga_horaria, descricao });
        mostrarMensagem("Curso atualizado com sucesso!");
        mostrarCursos();
    } catch (err) {
        alert(err.message);
    }
}

async function excluirCurso(id) {
    if (!confirm("Excluir curso?")) return;
    try {
        await api("DELETE", `/cursos/${id}`);
        mostrarMensagem("Curso excluído.");
        mostrarCursos();
    } catch (err) {
        alert(err.message);
    }
}

// ============================================================
// MATRÍCULAS
// ============================================================

async function mostrarMatriculas() {
    try {
        const matriculas = await api("GET", "/matriculas");

        const linhas = matriculas.length
            ? matriculas.map(m => `
                <tr>
                    <td>${m.aluno_nome}</td>
                    <td>${m.curso_nome}</td>
                    <td>${formatarData(m.data_matricula)}</td>
                    <td><span class="etiqueta disponivel">${m.status}</span></td>
                    <td>${botoesAcao(`editarMatricula(${m.id})`, `excluirMatricula(${m.id})`)}</td>
                </tr>
            `).join("")
            : `<tr><td colspan="5" class="estado-vazio">Nenhuma matrícula cadastrada.</td></tr>`;

        renderizarConteudo(`
            <h1>Matrículas</h1>
            <p class="subtitulo">Gerenciamento de matrículas.</p>

            <div class="card-filtros">
                <div class="campo-busca">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" id="buscaMatricula" placeholder="Buscar aluno ou curso" onkeyup="filtrarTabela('buscaMatricula', 'tabelaMatriculas')">
                </div>
                <div></div>
                <button class="botao-azul" onclick="abrirMatricula()">Nova Matrícula</button>
            </div>

            <div class="card-tabela">
                <table id="tabelaMatriculas">
                    <thead>
                        <tr><th>Aluno</th><th>Curso</th><th>Data</th><th>Status</th><th>Ações</th></tr>
                    </thead>
                    <tbody>${linhas}</tbody>
                </table>
            </div>
        `);
    } catch (err) {
        mostrarMensagem("Erro ao carregar matrículas.", "erro");
    }
}

async function abrirMatricula() {
    try {
        const [alunos, cursos] = await Promise.all([
            api("GET", "/alunos"),
            api("GET", "/cursos")
        ]);

        if (!alunos.length) { alert("Cadastre um aluno primeiro."); return; }
        if (!cursos.length) { alert("Cadastre um curso primeiro."); return; }

        const opcoesAlunos = alunos.map(a => `<option value="${a.id}">${a.nome}</option>`).join("");
        const opcoesCursos = cursos.map(c => `<option value="${c.id}">${c.nome} (${c.vagas_ocupadas}/${c.vagas_totais} vagas)</option>`).join("");

        renderizarConteudo(`
            <h1>Nova Matrícula</h1>
            <p class="subtitulo">Vincular aluno a um curso.</p>

            <div class="card-formulario">
                <div class="grade-formulario">
                    <div>
                        <label>Aluno <span class="obrigatorio">*</span></label>
                       <select id="alunoMatricula">${opcoesAlunos}</select>
                    </div>
                    <div>
                        <label>Curso <span class="obrigatorio">*</span></label>
                        <select id="cursoMatricula">${opcoesCursos}</select>
                    </div>
                    <div>
                        <label>Data <span class="obrigatorio">*</span></label>
                        <input type="date" id="dataMatricula">
                    </div>
                </div>
                <div class="acoes-formulario">
                    <button class="botao-cinza" onclick="mostrarMatriculas()">Cancelar</button>
                    <button class="botao-azul"  onclick="salvarMatricula()">Salvar</button>
                </div>
            </div>
        `);
    } catch (err) {
        alert("Erro ao carregar dados.");
    }
}

async function salvarMatricula() {
    const aluno_id       = obterValor("alunoMatricula");
    const curso_id       = obterValor("cursoMatricula");
    const data_matricula = obterValor("dataMatricula");

    if (!aluno_id || !curso_id || !data_matricula) {
        alert("Preencha todos os campos.");
        return;
    }

    try {
        await api("POST", "/matriculas", { aluno_id, curso_id, data_matricula });
        mostrarMensagem("Matrícula realizada com sucesso!");
        ativarMenu("menuMatriculas");
        mostrarMatriculas();
    } catch (err) {
        alert(err.message);
    }
}

async function editarMatricula(id) {
    try {
        const [matriculas, alunos, cursos] = await Promise.all([
            api("GET", "/matriculas"),
            api("GET", "/alunos"),
            api("GET", "/cursos")
        ]);

        const m = matriculas.find(x => x.id === id);
        if (!m) { alert("Matrícula não encontrada."); return; }

        const opcoesAlunos = alunos.map(a => `<option value="${a.id}" ${a.id === m.aluno_id ? "selected" : ""}>${a.nome}</option>`).join("");
        const opcoesCursos = cursos.map(c => `<option value="${c.id}" ${c.id === m.curso_id ? "selected" : ""}>${c.nome}</option>`).join("");

        renderizarConteudo(`
            <h1>Editar Matrícula</h1>
            <p class="subtitulo">Atualize os dados da matrícula.</p>

            <div class="card-formulario">
                <div class="grade-formulario">
                    <div>
                        <label>Aluno</label>
                        <select id="alunoMatricula">${opcoesAlunos}</select>
                    </div>
                    <div>
                        <label>Curso</label>
                        <select id="cursoMatricula">${opcoesCursos}</select>
                    </div>
                    <div>
                        <label>Data</label>
                        <input type="date" id="dataMatricula" value="${dataParaInput(m.data_matricula)}">
                    </div>
                </div>
                <div class="acoes-formulario">
                    <button class="botao-cinza" onclick="mostrarMatriculas()">Cancelar</button>
                    <button class="botao-azul"  onclick="salvarEdicaoMatricula(${id})">Salvar Alterações</button>
                </div>
            </div>
        `);
    } catch (err) {
        alert("Erro ao carregar matrícula.");
    }
}

async function salvarEdicaoMatricula(id) {
    const curso_id       = obterValor("cursoMatricula");
    const data_matricula = obterValor("dataMatricula");

    try {
        await api("PUT", `/matriculas/${id}`, { curso_id, data_matricula });
        mostrarMensagem("Matrícula atualizada com sucesso!");
        mostrarMatriculas();
    } catch (err) {
        alert(err.message);
    }
}

async function excluirMatricula(id) {
    if (!confirm("Deseja cancelar esta matrícula?")) return;
    try {
        await api("DELETE", `/matriculas/${id}`);
        mostrarMensagem("Matrícula cancelada.");
        mostrarMatriculas();
    } catch (err) {
        alert(err.message);
    }
}

// ============================================================
// ATENDIMENTOS
// ============================================================

async function mostrarAtendimentos() {
    try {
        const atendimentos = await api("GET", "/atendimentos");

        const linhas = atendimentos.length
            ? atendimentos.map(a => {
                const cls = a.status === "Realizado" ? "realizado" : a.status === "Cancelado" ? "cancelado" : "agendado";
                return `
                    <tr>
                        <td>${a.aluno_nome}</td>
                        <td>${formatarData(a.data_atendimento)}</td>
                        <td>${a.horario}</td>
                        <td>${a.motivo || "-"}</td>
                        <td class="status-atendimento"><span class="etiqueta ${cls}">${a.status}</span></td>
                        <td>${botoesAcao(`editarAtendimento(${a.id})`, `excluirAtendimento(${a.id})`)}</td>
                    </tr>
                `;
            }).join("")
            : `<tr><td colspan="6" class="estado-vazio">Nenhum atendimento cadastrado.</td></tr>`;

        renderizarConteudo(`
            <h1>Atendimentos</h1>
            <p class="subtitulo">Gerenciamento de atendimentos.</p>

            <div class="card-filtros">
                <div class="campo-busca">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" id="buscaAtendimento" placeholder="Buscar aluno" onkeyup="filtrarTabela('buscaAtendimento', 'tabelaAtendimentos')">
                </div>
                <select id="filtroStatus" onchange="filtrarAtendimentos()">
                    <option value="Todos">Todos</option>
                    <option value="Agendado">Agendado</option>
                    <option value="Realizado">Realizado</option>
                    <option value="Cancelado">Cancelado</option>
                </select>
                <button class="botao-azul" onclick="abrirAtendimento()">Agendar Atendimento</button>
            </div>

            <div class="card-tabela">
                <table id="tabelaAtendimentos">
                    <thead>
                        <tr><th>Aluno</th><th>Data</th><th>Horário</th><th>Motivo</th><th>Status</th><th>Ações</th></tr>
                    </thead>
                    <tbody>${linhas}</tbody>
                </table>
            </div>
        `);
    } catch (err) {
        mostrarMensagem("Erro ao carregar atendimentos.", "erro");
    }
}

async function abrirAtendimento() {
    try {
        const alunos = await api("GET", "/alunos");
        if (!alunos.length) { alert("Cadastre um aluno primeiro."); return; }

        const opcoesAlunos = alunos.map(a => `<option value="${a.id}">${a.nome}</option>`).join("");

        renderizarConteudo(`
            <h1>Agendar Atendimento</h1>
            <p class="subtitulo">Novo atendimento.</p>

            <div class="card-formulario">
                <div class="grade-formulario">
                    <div>
                        <label>Aluno <span class="obrigatorio">*</span></label>
                        <select id="alunoAtendimento">${opcoesAlunos}</select>
                    </div>
                    <div>
                        <label>Data <span class="obrigatorio">*</span></label>
                        <input type="date" id="dataAtendimento">
                    </div>
                    <div>
                        <label>Horário <span class="obrigatorio">*</span></label>
                        <input type="time" id="horaAtendimento">
                    </div>
                    <div>
                        <label>Status</label>
                        <select id="statusAtendimento">
                            <option>Agendado</option>
                            <option>Realizado</option>
                            <option>Cancelado</option>
                        </select>
                    </div>
                    <div class="linha-inteira">
                        <label>Motivo</label>
                        <textarea id="motivoAtendimento"></textarea>
                    </div>
                </div>
                <div class="acoes-formulario">
                    <button class="botao-cinza" onclick="mostrarAtendimentos()">Cancelar</button>
                    <button class="botao-azul"  onclick="salvarAtendimento()">Salvar</button>
                </div>
            </div>
        `);
    } catch (err) {
        alert("Erro ao carregar dados.");
    }
}

async function salvarAtendimento() {
    const aluno_id         = obterValor("alunoAtendimento");
    const data_atendimento = obterValor("dataAtendimento");
    const horario          = obterValor("horaAtendimento");
    const motivo           = obterValor("motivoAtendimento");
    const status           = obterValor("statusAtendimento");

    if (!aluno_id || !data_atendimento || !horario) {
        alert("Aluno, data e horário são obrigatórios.");
        return;
    }

    try {
        await api("POST", "/atendimentos", { aluno_id, data_atendimento, horario, motivo, status });
        mostrarMensagem("Atendimento agendado com sucesso!");
        ativarMenu("menuAtendimentos");
        mostrarAtendimentos();
    } catch (err) {
        alert(err.message);
    }
}

async function editarAtendimento(id) {
    try {
        const [atendimentos, alunos] = await Promise.all([
            api("GET", "/atendimentos"),
            api("GET", "/alunos")
        ]);

        const a = atendimentos.find(x => x.id === id);
        if (!a) { alert("Atendimento não encontrado."); return; }

        const opcoesAlunos = alunos.map(al => `<option value="${al.id}" ${al.id === a.aluno_id ? "selected" : ""}>${al.nome}</option>`).join("");

        renderizarConteudo(`
            <h1>Editar Atendimento</h1>
            <p class="subtitulo">Atualize os dados do atendimento.</p>

            <div class="card-formulario">
                <div class="grade-formulario">
                    <div>
                        <label>Aluno</label>
                        <select id="alunoAtendimento">${opcoesAlunos}</select>
                    </div>
                    <div>
                        <label>Data</label>
                        <input type="date" id="dataAtendimento" value="${dataParaInput(a.data_atendimento)}">
                    </div>
                    <div>
                        <label>Horário</label>
                        <input type="time" id="horaAtendimento" value="${a.horario}">
                    </div>
                    <div>
                        <label>Status</label>
                        <select id="statusAtendimento">
                            <option ${a.status === "Agendado"  ? "selected" : ""}>Agendado</option>
                            <option ${a.status === "Realizado" ? "selected" : ""}>Realizado</option>
                            <option ${a.status === "Cancelado" ? "selected" : ""}>Cancelado</option>
                        </select>
                    </div>
                    <div class="linha-inteira">
                        <label>Motivo</label>
                        <textarea id="motivoAtendimento">${a.motivo || ""}</textarea>
                    </div>
                </div>
                <div class="acoes-formulario">
                    <button class="botao-cinza" onclick="mostrarAtendimentos()">Cancelar</button>
                    <button class="botao-azul"  onclick="salvarEdicaoAtendimento(${id})">Salvar Alterações</button>
                </div>
            </div>
        `);
    } catch (err) {
        alert("Erro ao carregar atendimento.");
    }
}

async function salvarEdicaoAtendimento(id) {
    const aluno_id         = obterValor("alunoAtendimento");
    const data_atendimento = obterValor("dataAtendimento");
    const horario          = obterValor("horaAtendimento");
    const status           = obterValor("statusAtendimento");
    const motivo           = obterValor("motivoAtendimento");

    try {
        await api("PUT", `/atendimentos/${id}`, { aluno_id, data_atendimento, horario, motivo, status });
        mostrarMensagem("Atendimento atualizado com sucesso!");
        mostrarAtendimentos();
    } catch (err) {
        alert(err.message);
    }
}

async function excluirAtendimento(id) {
    if (!confirm("Deseja excluir este atendimento?")) return;
    try {
        await api("DELETE", `/atendimentos/${id}`);
        mostrarMensagem("Atendimento excluído.");
        mostrarAtendimentos();
    } catch (err) {
        alert(err.message);
    }
}

// ============================================================
// FILTROS GENÉRICOS
// ============================================================

function filtrarTabela(inputId, tabelaId) {
    const texto = obterValor(inputId).toLowerCase();
    const tabela = document.getElementById(tabelaId);
    if (!tabela) return;
    tabela.querySelectorAll("tbody tr").forEach(linha => {
        linha.style.display = linha.textContent.toLowerCase().includes(texto) ? "" : "none";
    });
}

function filtrarAlunos() {
    const texto = obterValor("buscaAluno").toLowerCase();
    const nivel = obterValor("filtroNivelAluno");
    document.querySelectorAll("#tabelaAlunos tbody tr").forEach(linha => {
        const passaBusca = linha.textContent.toLowerCase().includes(texto);
        const nivelLinha = linha.children[3]?.textContent.trim();
        const passaNivel = nivel === "Todos" || nivelLinha === nivel;
        linha.style.display = passaBusca && passaNivel ? "" : "none";
    });
}

function filtrarCursos() {
    const texto  = obterValor("buscaCurso").toLowerCase();
    const status = obterValor("filtroStatusCurso");
    document.querySelectorAll("#tabelaCursos tbody tr").forEach(linha => {
        const passaBusca  = linha.textContent.toLowerCase().includes(texto);
        const statusLinha = linha.children[4]?.textContent.trim();
        const passaStatus = status === "Todos" || statusLinha === status;
        linha.style.display = passaBusca && passaStatus ? "" : "none";
    });
}

function filtrarAtendimentos() {
    const texto  = obterValor("buscaAtendimento").toLowerCase();
    const status = obterValor("filtroStatus");
    document.querySelectorAll("#tabelaAtendimentos tbody tr").forEach(linha => {
        const passaBusca  = linha.textContent.toLowerCase().includes(texto);
        const celula      = linha.querySelector(".status-atendimento");
        if (!celula) return;
        const passaStatus = status === "Todos" || celula.textContent.trim() === status;
        linha.style.display = passaBusca && passaStatus ? "" : "none";
    });

    function filtrarSelectAluno(inputId, selectId) {
    const texto = obterValor(inputId).toLowerCase();
    const select = document.getElementById(selectId);
    Array.from(select.options).forEach(op => {
        op.style.display = op.text.toLowerCase().includes(texto) ? "" : "none";
    });
    }
}
