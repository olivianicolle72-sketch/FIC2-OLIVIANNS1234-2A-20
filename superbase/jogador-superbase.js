(function () {
  "use strict";

  const form = document.getElementById("formJogadorSupabase");
  const campoNome = document.getElementById("nomeJogadorSupabase");
  const campoNick = document.getElementById("nickJogadorSupabase");
  const campoIdade = document.getElementById("idadeJogadorSupabase");
  const campoScore = document.getElementById("scoreJogadorSupabase");

  const tituloFormulario = document.getElementById("tituloFormularioSupabase");
  const btnSalvar = document.getElementById("btnSalvarSupabase");
  const btnCancelar = document.getElementById("btnCancelarSupabase");
  const btnConectar = document.getElementById("btnConectar");
  const btnDesconectar = document.getElementById("btnDesconectar");
  const btnAtualizar = document.getElementById("btnAtualizarLista");
  const campoUrl = document.getElementById("supabaseUrl");
  const campoChave = document.getElementById("supabaseKey");
  const statusConexao = document.getElementById("statusConexao");
  const mensagem = document.getElementById("mensagemCrudSupabase");
  const lista = document.getElementById("listaJogadoresSupabase");
  const listaVazia = document.getElementById("listaVaziaSupabase");
  const contador = document.getElementById("contadorSupabase");

  let cliente = null;
  let idEmEdicao = null;
  let jogadores = [];

  function mostrarStatus(elemento, texto, tipo) {
    elemento.textContent = texto;
    elemento.dataset.tipo = tipo || "info";
  }

  function mostrarErro(erro, contexto) {
    console.error(contexto, erro);
    const detalhe = erro && erro.message ? erro.message : "Verifique a conexão e as permissões da tabela.";
    mostrarStatus(mensagem, contexto + " " + detalhe, "erro");
  }

  function limparFormulario() {
    form.reset();
    if (campoScore) campoScore.value = "0";
    if (campoIdade) campoIdade.value = "18";
    idEmEdicao = null;
    tituloFormulario.textContent = "Cadastrar astronauta no Supabase";
    btnSalvar.textContent = "Cadastrar no banco";
    btnCancelar.hidden = true;
  }

  function celula(texto) {
    const td = document.createElement("td");
    td.textContent = String(texto !== null && texto !== undefined ? texto : "");
    return td;
  }

  function botao(texto, classe, acao, rotulo) {
    const elemento = document.createElement("button");
    elemento.type = "button";
    elemento.className = classe;
    elemento.textContent = texto;
    elemento.setAttribute("aria-label", rotulo);
    elemento.addEventListener("click", acao);
    return elemento;
  }

  async function carregarJogadores() {
    if (!cliente) {
      mostrarStatus(statusConexao, "Conecte-se ao Supabase antes de consultar.", "erro");
      return;
    }

    mostrarStatus(statusConexao, "Consultando public.astronauta...", "info");  
    const resposta = await cliente  
        .from("astronauta")  
        .select("id_astro, nome, nickname, idade, genero, score")  
        .order("score", { ascending: false });  

    if (resposta.error) {  
        mostrarErro(resposta.error, "Falha ao consultar astronautas:");  
        mostrarStatus(statusConexao, "Consulta não concluída. Confira RLS e nome da tabela.", "erro");  
        return;  
    }  

    jogadores = resposta.data || [];  
    renderizar();  
    mostrarStatus(statusConexao, "Conectado. " + jogadores.length + " astronauta(s) recuperado(s).", "sucesso");
  }

  function renderizar() {
    lista.replaceChildren();
    contador.textContent = jogadores.length + (jogadores.length === 1 ? " astronauta" : " astronautas");
    listaVazia.hidden = jogadores.length > 0;
    listaVazia.textContent = jogadores.length ? "" : "Nenhum astronauta encontrado na tabela.";

    jogadores.forEach(function (jogador) {  
        const linha = document.createElement("tr");  
        linha.appendChild(celula(jogador.id_astro));  
        linha.appendChild(celula(jogador.nome));  
        linha.appendChild(celula(jogador.nickname));  
        linha.appendChild(celula(jogador.idade));  
        linha.appendChild(celula(jogador.score));  

        const tdAcoes = document.createElement("td");  
        const acoes = document.createElement("div");  
        acoes.className = "acoes-registro";  

        // Botão Jogar direto do banco
        acoes.appendChild(botao("Jogar", "botao-pequeno", function () {  
            const dadosJogador = JSON.stringify(jogador);
            localStorage.setItem("jogadorAtual", dadosJogador);
            localStorage.setItem("astronauta", dadosJogador);
            window.location.href = "http://127.0.0.1:5500/game/pato.html";
        }, "Jogar com " + jogador.nickname));  

        acoes.appendChild(botao("Editar", "botao-pequeno botao-neutro", function () {  
            iniciarEdicao(jogador);  
        }, "Editar " + jogador.nickname));  

        acoes.appendChild(botao("Excluir", "botao-pequeno botao-perigo", function () {  
            excluirJogador(jogador);  
        }, "Excluir " + jogador.nickname));  

        tdAcoes.appendChild(acoes);  
        linha.appendChild(tdAcoes);  
        lista.appendChild(linha);  
    });
  }

  function iniciarEdicao(jogador) {
    idEmEdicao = jogador.id_astro;
    campoNome.value = jogador.nome || "";
    campoNick.value = jogador.nickname || "";
    campoIdade.value = jogador.idade || 18;
    campoScore.value = jogador.score || 0;

    tituloFormulario.textContent = "Editar astronauta (ID " + jogador.id_astro + ")";
    btnSalvar.textContent = "Salvar alterações";
    btnCancelar.hidden = false;
    campoNome.focus();
  }

  async function excluirJogador(jogador) {
    if (!window.confirm(`Deseja excluir "${jogador.nickname}" do banco de dados?`)) return;

    const resposta = await cliente  
        .from("astronauta")  
        .delete()  
        .eq("id_astro", jogador.id_astro);  

    if (resposta.error) {  
        mostrarErro(resposta.error, "Não foi possível excluir:");  
        return;  
    }  

    if (idEmEdicao === jogador.id_astro) limparFormulario();  
    mostrarStatus(mensagem, "Astronauta excluído do PostgreSQL.", "sucesso");  
    await carregarJogadores();
  }

  async function conectar() {
    const url = campoUrl.value.trim();
    const chave = campoChave.value.trim();

    if (!url || !chave || url.indexOf("https://") !== 0) {  
        mostrarStatus(statusConexao, "Informe uma Project URL válida e a chave pública.", "erro");  
        return;  
    }  
    if (!window.supabase || typeof window.supabase.createClient !== "function") {  
        mostrarStatus(statusConexao, "A biblioteca Supabase não foi carregada.", "erro");  
        return;  
    }  

    try {  
        cliente = window.supabase.createClient(url, chave);  
        await carregarJogadores();  
    } catch (erro) {  
        cliente = null;  
        mostrarErro(erro, "Não foi possível iniciar a conexão:");  
    }
  }

  form.addEventListener("submit", async function (evento) {
    evento.preventDefault();
    if (!cliente) {
      mostrarStatus(mensagem, "Conecte-se ao Supabase antes de salvar.", "erro");
      return;
    }

    const nome = campoNome.value.trim();  
    const nickname = campoNick.value.trim();
    const idade = Number(campoIdade.value);
    const score = Number(campoScore.value);

    if (!nome || !nickname) {  
        mostrarStatus(mensagem, "Preencha o nome e o nick.", "erro");  
        return;  
    }  

    const dados = { 
      nome: nome, 
      nickname: nickname, 
      idade: idade, 
      score: score 
    };  
    let resposta;  

    if (idEmEdicao !== null) {  
        resposta = await cliente.from("astronauta").update(dados).eq("id_astro", idEmEdicao);  
    } else {  
        resposta = await cliente.from("astronauta").insert([dados]);  
    }  

    if (resposta.error) {  
        mostrarErro(resposta.error, "Não foi possível salvar:");  
        return;  
    }  

    mostrarStatus(mensagem, idEmEdicao !== null ? "Astronauta atualizado!" : "Astronauta cadastrado!", "sucesso");  
    limparFormulario();  
    await carregarJogadores();
  });

  btnConectar.addEventListener("click", conectar);
  btnDesconectar.addEventListener("click", function () {
    cliente = null;
    jogadores = [];
    renderizar();
    mostrarStatus(statusConexao, "Desconectado.", "info");
  });
  btnAtualizar.addEventListener("click", carregarJogadores);
  btnCancelar.addEventListener("click", function () {
    limparFormulario();
    mostrarStatus(mensagem, "Edição cancelada.", "info");
  });

  const config = window.SUPABASE_CONFIG || {};
  if (config.url) campoUrl.value = config.url;
  if (config.anonKey) campoChave.value = config.anonKey;
})();
