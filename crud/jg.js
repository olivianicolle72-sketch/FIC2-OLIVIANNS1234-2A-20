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
let clienteSupabase = null;

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
  inicializarSupabase();
  inicializar();
}

function inicializarSupabase() {
  const cfg = window.SUPABASE_CONFIG || {};
  if (window.supabase && cfg.url && cfg.anonKey) {
    clienteSupabase = window.supabase.createClient(cfg.url, cfg.anonKey);
  }
}

async function inicializar() {
  await carregarAstronauta();
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

async function salvarAstronauta(evento) {
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

  const dadosBanco = {
    nome: nome,
    nickname: nickname,
    idade: idade,
    genero: genero,
    score: 0
  };

  if (clienteSupabase) {
    const resposta = await clienteSupabase.from("astronauta").insert([dadosBanco]).select();
    if (resposta.error) {
      console.error("Erro Supabase:", resposta.error);
      alert("Não foi possível salvar no banco de dados.");
      return;
    }
    if (resposta.data && resposta.data.length > 0) {
      astronauta = resposta.data[0];
    }
  } else {
    astronauta = { id_astro: Date.now(), ...dadosBanco };
  }

  try {  
      sincronizarJogadorAtual();  
  } catch (erro) {  
      console.error("Erro ao salvar astronauta:", erro);  
      alert("Não foi possível salvar os dados.");  
      return;  
  }  

  btnJogar.disabled = false;  
  renderizarAstronauta();  
  limparFormulario();  

  alert("Astronauta cadastrado com sucesso!");
}

async function carregarAstronauta() {
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

  const scoreP = document.createElement("p");
  scoreP.innerHTML = `Score Máximo: <strong>${astronauta.score || 0}</strong>`;

  const acoes = document.createElement("div");  
  acoes.className = "acoes";  

  const btnExcluir = document.createElement("button");  
  btnExcluir.type = "button";  
  btnExcluir.className = "botao-excluir";  
  btnExcluir.textContent = "Excluir";  
  btnExcluir.addEventListener("click", excluirAstronauta);  

  acoes.append(btnExcluir);  
  card.append(titulo, nome, idade, genero, scoreP, acoes);  
  listaJogadores.appendChild(card);
}

async function excluirAstronauta() {
  if (!astronauta) return;

  const confirmou = confirm(`Deseja excluir o astronauta "${astronauta.nickname}"?`);  
  if (!confirmou) return;  

  if (clienteSupabase && astronauta.id_astro) {
    await clienteSupabase.from("astronauta").delete().eq("id_astro", astronauta.id_astro);
  }

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
      window.location.href = CONFIG.paginaJogo;  
  } catch (erro) {  
      console.error("Erro ao iniciar o jogo:", erro);  
      alert("Não foi possível iniciar o jogo.");  
  }
}
