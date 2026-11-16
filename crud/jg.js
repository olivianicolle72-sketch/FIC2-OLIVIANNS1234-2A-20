
const CONFIG = {
    chaveLocalStorage: "astronauta",
    chaveJogadorAtual: "jogadorAtual",
    paginaJogo: "http://127.0.0.1:5500/game/pato.html"
};

const formulario = document.getElementById("from");
const campoId = document.getElementById("idJogador");
const campoNome = document.getElementById("nome");
const campoNickname = document.getElementById("user");
const campoIdade = document.getElementById("idade");
const listaJogadores = document.getElementById("listaJogadores");
const contador = document.getElementById("contador");
const btnSalvar = document.getElementById("ENVIAR");
const btnJogar = document.getElementById("JOGAR");

let astronauta = null;

if (
    !formulario ||
    !campoId ||
    !campoNome ||
    !campoNickname ||
    !campoIdade ||
    !listaJogadores ||
    !contador ||
    !btnSalvar ||
    !btnJogar
) {
    console.error("Erro: confira os IDs dos elementos no HTML.");
} else {
    inicializar();
}

function inicializar() {
    carregarAstronauta();
    renderizarAstronauta();

    btnJogar.disabled = !astronauta;

    formulario.addEventListener("submit", salvarAstronauta);
    btnJogar.addEventListener("click", jogar);

    btnSalvar.type = "submit";
}

function getGenero() {
    const selecionado = document.querySelector('input[name="genero"]:checked');
    return selecionado ? selecionado.value : "";
}

function sincronizarJogadorAtual() {
    if (astronauta) {
        const json = JSON.stringify(astronauta);
        localStorage.setItem(CONFIG.chaveLocalStorage, json);
        localStorage.setItem(CONFIG.chaveJogadorAtual, json);
    } else {
        localStorage.removeItem(CONFIG.chaveLocalStorage);
        localStorage.removeItem(CONFIG.chaveJogadorAtual);
    }
}

function salvarAstronauta(evento) {
    evento.preventDefault();

    const nome = campoNome.value.trim();
    const nickname = campoNickname.value.trim();
    const idade = Number(campoIdade.value);
    const genero = getGenero();

    if (!nome) {
        alert("Informe o nome do astronauta.");
        campoNome.focus();
        return;
    }

    if (!nickname) {
        alert("Informe o seu nick.");
        campoNickname.focus();
        return;
    }

    if (
        campoIdade.value.trim() === "" ||
        !Number.isFinite(idade) ||
        idade < 18 ||
        idade > 50
    ) {
        alert("A idade deve estar entre 18 e 50 anos.");
        campoIdade.focus();
        return;
    }

    if (!genero) {
        alert("Selecione o gênero.");
        return;
    }

    const astronautaAnterior = astronauta;

    if (astronauta) {
        astronauta = {
            ...astronauta,
            nome,
            nickname,
            idade,
            genero
        };
    } else {
        astronauta = {
            id: Date.now(),
            nome,
            nickname,
            idade,
            genero
        };
    }

    try {
        sincronizarJogadorAtual();
    } catch (erro) {
        astronauta = astronautaAnterior;
        console.error("Erro ao salvar astronauta:", erro);
        alert("Não foi possível salvar os dados.");
        return;
    }

    btnJogar.disabled = false;

    renderizarAstronauta();
    limparFormulario();

    alert(
        astronautaAnterior
            ? "Astronauta atualizado com sucesso!"
            : "Astronauta cadastrado com sucesso!"
    );
}

function carregarAstronauta() {
    const dados = localStorage.getItem(CONFIG.chaveLocalStorage);

    if (!dados) {
        astronauta = null;
        localStorage.removeItem(CONFIG.chaveJogadorAtual);
        return;
    }

    try {
        astronauta = JSON.parse(dados);
        sincronizarJogadorAtual();
    } catch (erro) {
        console.error("Erro ao carregar astronauta:", erro);
        astronauta = null;
        localStorage.removeItem(CONFIG.chaveLocalStorage);
        localStorage.removeItem(CONFIG.chaveJogadorAtual);
    }
}

function renderizarAstronauta() {
    listaJogadores.innerHTML = "";

    if (!astronauta) {
        contador.textContent = "Nenhum astronauta cadastrado";

        const mensagem = document.createElement("div");
        mensagem.className = "lista-vazia";
        mensagem.textContent = "Nenhum astronauta cadastrado";

        listaJogadores.appendChild(mensagem);
        return;
    }

    contador.textContent = "Astronauta cadastrado";

    const card = document.createElement("article");
    card.className = "card";

    const titulo = document.createElement("h3");
    titulo.textContent = astronauta.nickname;

    const nome = document.createElement("p");
    nome.textContent = `Nome: ${astronauta.nome}`;

    const idade = document.createElement("p");
    idade.textContent = `Idade: ${astronauta.idade}`;

    const genero = document.createElement("p");
    genero.textContent = `Gênero: ${astronauta.genero}`;

    const acoes = document.createElement("div");
    acoes.className = "acoes";

    const btnEditar = document.createElement("button");
    btnEditar.type = "button";
    btnEditar.textContent = "Editar";
    btnEditar.addEventListener("click", editarAstronauta);

    const btnExcluir = document.createElement("button");
    btnExcluir.type = "button";
    btnExcluir.className = "botao-excluir";
    btnExcluir.textContent = "Excluir";
    btnExcluir.addEventListener("click", excluirAstronauta);

    acoes.append(btnEditar, btnExcluir);
    card.append(titulo, nome, idade, genero, acoes);
    listaJogadores.appendChild(card);
}

function editarAstronauta() {
    if (!astronauta) return;

    campoId.value = astronauta.id;
    campoNome.value = astronauta.nome;
    campoNickname.value = astronauta.nickname;
    campoIdade.value = astronauta.idade;

    document.querySelectorAll('input[name="genero"]').forEach(function (radio) {
        radio.checked = radio.value === astronauta.genero;
    });

    btnSalvar.textContent = "ATUALIZAR";
    campoNome.focus();
}

function excluirAstronauta() {
    if (!astronauta) return;

    const confirmou = confirm(
        `Deseja excluir o astronauta "${astronauta.nickname}"?`
    );

    if (!confirmou) return;

    astronauta = null;
    sincronizarJogadorAtual();
    btnJogar.disabled = true;

    renderizarAstronauta();
    limparFormulario();

    alert("Astronauta excluído com sucesso!");
}

function limparFormulario() {
    formulario.reset();
    campoId.value = "";
    btnSalvar.textContent = "ENVIAR";
}

function jogar() {
    if (!astronauta) {
        alert("Cadastre seu astronauta primeiro.");
        return;
    }

    try {
        sincronizarJogadorAtual();

        const parametros = new URLSearchParams({
            nome: astronauta.nome,
            nickname: astronauta.nickname,
            idade: astronauta.idade,
            genero: astronauta.genero
        });

        window.location.href = `${CONFIG.paginaJogo}?${parametros.toString()}`;
    } catch (erro) {
        console.error("Erro ao iniciar o jogo:", erro);
        alert("Não foi possível iniciar o jogo.");
    }
}