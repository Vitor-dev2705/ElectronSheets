let opcoes_hierarquico = null;
let currentPage = 1;
const totalPages = 2;
const cargoParticipantesDiv = document.getElementById("cargoParticipantesDiv");
const requiredInputs = {
  pages: [
    "missao",
    "evento",
    "objetivo_missao",
    "justificativa",
    "prioridade",
    "eventual_prej",
    "ambito",
    "cidadesSelecionadas",
    "inicio_miss",
    "term_miss",
    "inicio_desl",
    "term_desl",
    "numeroParticipantes",
    "num_diarias",
  ],
};

// API para comunicação com o backend
window.api.receive("fromMain", async (data) => {
  if (data.error) {
    console.error(data.error);
    return;
  }

  const cargosJSON = data;
  if (!cargosJSON || typeof cargosJSON !== "object") {
    console.error(
      "cargosJSON é indefinido ou não é um objeto válido:",
      cargosJSON
    );
    return;
  }

  opcoes_hierarquico = Object.values(cargosJSON).flatMap((categoria) =>
    Object.values(categoria).flatMap((item) => item.descricao)
  );
});

class PAGES {
  constructor() {
    this.currentPage = 1; // Página inicial
    this.initNavigation();
  }

  // Função para atualizações do btn
  updateButtons() {
    const navButtons = document.getElementById("navigationButtons");
    if (currentPage === 1) {
      document.getElementById("prevBtn").classList.add("hidden");
      navButtons.classList.remove("justify-between");
      navButtons.classList.add("justify-end"); // Alinha o botão à direita
    } else {
      document.getElementById("prevBtn").classList.remove("hidden");
      navButtons.classList.remove("justify-end");
      navButtons.classList.add("justify-between"); // Distribui os botões
    }

    if (currentPage === totalPages) {
      document.getElementById("nextBtn").classList.add("hidden");
      document.getElementById("submitBtn").classList.remove("hidden");
    } else {
      document.getElementById("nextBtn").classList.remove("hidden");
      document.getElementById("submitBtn").classList.add("hidden");
    }
  }

  initNavigation() {
    const nextBtn = document.getElementById("nextBtn");
    const prevBtn = document.getElementById("prevBtn");

    nextBtn.addEventListener("click", () => this.navigatePage(1));
    prevBtn.addEventListener("click", () => this.navigatePage(-1));

    this.updateButtons();
  }

  navigatePage(step) {
    if (currentPage + step > 0 && currentPage + step <= totalPages) {
      document.getElementById(`page${currentPage}`).classList.add("hidden");
      currentPage += step;
      document.getElementById(`page${currentPage}`).classList.remove("hidden");
    }
    this.updateButtons(); // Atualiza visibilidade dos botões com base na página atual
  }
}
const API = {
  // Carregar cidade estado
  async carregarCidadesNacionais() {
    try {
      // Carrega os estados e municípios da API do IBGE
      const municipiosResponse = await fetch(
        "https://servicodados.ibge.gov.br/api/v1/localidades/municipios"
      );

      const municipios = await municipiosResponse.json();

      return municipios;
    } catch (error) {
      console.error("Erro ao carregar os dados: ", error);
    }
  },

  // Popular datalist de cidadades/municipios
  async popularDatalist() {
    const estados = await this.carregarCidadesNacionais(); // Busca os estados
    const ulElement = document.getElementById("cidadeEstadoOptions"); // UL onde os LIs serão adicionados

    ulElement.innerHTML = ""; // Limpa o conteúdo anterior

    estados.forEach((estado, index) => {
      // Criação do elemento <li>
      const li = document.createElement("li");

      // Container principal do item
      const div = document.createElement("div");
      div.classList.add(
        "flex",
        "items-center",
        "rounded",
        "p-2",
        "hover:bg-gray-100",
        "dark:hover:bg-gray-600"
      );

      // Checkbox
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `checkbox-item-${index}`;
      checkbox.value = estado.nome;
      checkbox.classList.add(
        "h-4",
        "w-4",
        "rounded",
        "border-gray-300",
        "bg-gray-100",
        "text-blue-600",
        "focus:ring-2",
        "focus:ring-blue-500",
        "dark:border-gray-500",
        "dark:bg-gray-600",
        "dark:ring-offset-gray-700",
        "dark:focus:ring-blue-600",
        "dark:focus:ring-offset-gray-700"
      );

      // Label
      const label = document.createElement("label");
      label.htmlFor = `checkbox-item-${index}`;
      label.classList.add(
        "ms-2",
        "w-full",
        "rounded",
        "text-sm",
        "font-medium",
        "text-gray-900",
        "dark:text-gray-300"
      );
      label.textContent = `${estado.nome} - ${estado.microrregiao.mesorregiao.UF.nome}`;

      // Monta a estrutura
      div.appendChild(checkbox);
      div.appendChild(label);
      li.appendChild(div);
      ulElement.appendChild(li);
    });
  },

  pesquisarCidades() {
    const input = document
      .getElementById("cidadeEstadoInput")
      .value.toLowerCase(); // Texto digitado no input
    const items = document.querySelectorAll("#cidadeEstadoOptions li"); // Todos os <li> da lista

    items.forEach((item) => {
      const label = item.querySelector("label").textContent.toLowerCase(); // Texto do label do item

      // Verifica se o texto do label inclui o valor do input
      if (label.includes(input)) {
        item.style.display = "block"; // Exibe o item se corresponder
      } else {
        item.style.display = "none"; // Oculta o item se não corresponder
      }
    });
  },

  // Carregar países internacionais
  async carregarPaisesInternacionais() {
    try {
      const response = await fetch("https://restcountries.com/v3.1/all");
      const data = await response.json();

      return data;
    } catch (error) {
      console.error("Erro ao carregar dados internacionais: ", error);
    }
  },

  // Popular datalist de países internacionais
  async popularDatalistInternacional() {
    const internacionalCountries = await this.carregarPaisesInternacionais();
    const datalist = document.getElementById("cidadeEstadoOptions");

    internacionalCountries.forEach((countries) => {
      const countries_pt = countries.translations.por.common;

      if (countries_pt.toLowerCase().startsWith("brasil")) {
        return;
      } else {
        const option = document.createElement("option");
        option.value = countries_pt;
        datalist.appendChild(option);
      }
    });
  },
};

const UI = {
  async gerarCamposCargos() {
    const numParticipantesInput = document.getElementById(
      "numeroParticipantes"
    );
    const numParticipantesValue = parseInt(numParticipantesInput.value);
    const error = document.getElementById("error-msg");
    const totalDiariasInput = document.getElementById("num_diarias");
    const cargoParticipantesDiv = document.getElementById(
      "cargoParticipantesDiv"
    );

    cargoParticipantesDiv.innerHTML = "";

    if (numParticipantesValue >= 21) {
      numParticipantesInput.classList.add(
        "border",
        "border-red-500",
        "rounded",
        "focus:outline-none",
        "focus:shadow-outline"
      );
      error.classList.remove("hidden");
    } else {
      numParticipantesInput.classList.remove("border-red-500");
      error.classList.add("hidden");

      const atualizarTotalDiarias = () => {
        let total = 0;
        document.querySelectorAll(".diarias-input").forEach((input) => {
          total += parseFloat(input.value) || 0;
        });
        totalDiariasInput.value = total.toFixed(1);
      };

      for (let i = 1; i <= numParticipantesValue; i++) {
        const containerDiv = document.createElement("div");
        containerDiv.classList.add(
          "flex",
          "items-start",
          "space-y-4",
          "flex-col",
          "mt-3",
          "gap-2"
        );

        // Campo de Cargo/Função
        const divSelect = document.createElement("div");
        divSelect.classList.add("flex-1");
        const labelSelect = document.createElement("label");
        labelSelect.innerHTML = `${i}º Cargo ou Função`;
        labelSelect.classList.add(
          "block",
          "text-gray-700",
          "text-sm",
          "font-bold",
          "mb-2"
        );
        const select = document.createElement("select");
        select.classList.add(
          "w-full",
          "rounded-lg",
          "border-2",
          "border-gray-400",
          "p-4",
          "text-sm",
          "shadow-sm"
        );

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.text = "Selecione o Cargo/Emprego/Função";
        defaultOption.disabled = true;
        defaultOption.selected = true;
        select.appendChild(defaultOption);

        const opcoes = Object.values(opcoes_hierarquico).flatMap(
          (categoria) => categoria
        );
        opcoes.forEach((opcao) => {
          const option = document.createElement("option");
          option.value = opcao;
          option.text = opcao;
          select.appendChild(option);
        });

        divSelect.appendChild(labelSelect);
        divSelect.appendChild(select);

        // Campo de Diárias
        const divDiarias = document.createElement("div");
        divDiarias.classList.add("flex-1");
        const labelDiarias = document.createElement("label");
        labelDiarias.innerHTML = `Nº de Diárias`;
        labelDiarias.classList.add(
          "block",
          "text-gray-700",
          "text-sm",
          "font-bold",
          "mb-2"
        );

        const inputContainer = document.createElement("div");
        inputContainer.classList.add(
          "relative",
          "flex",
          "items-center",
          "max-w-[8rem]"
        );

        const decrementButton = document.createElement("button");
        decrementButton.type = "button";
        decrementButton.classList.add(
          "bg-gray-100",
          "border",
          "border-gray-300",
          "rounded-s-lg",
          "p-3",
          "h-11",
          "hover:bg-gray-200"
        );
        decrementButton.innerHTML = `-`;

        const inputDiarias = document.createElement("input");
        inputDiarias.type = "text";
        inputDiarias.value = "0";
        inputDiarias.classList.add(
          "diarias-input",
          "bg-gray-50",
          "border-x-0",
          "border-gray-300",
          "h-11",
          "text-center",
          "text-gray-900",
          "text-sm",
          "w-full"
        );

        const incrementButton = document.createElement("button");
        incrementButton.type = "button";
        incrementButton.classList.add(
          "bg-gray-100",
          "border",
          "border-gray-300",
          "rounded-e-lg",
          "p-3",
          "h-11",
          "hover:bg-gray-200"
        );
        incrementButton.innerHTML = `+`;

        decrementButton.addEventListener("click", () => {
          let value = parseFloat(inputDiarias.value) || 0;
          if (value > 0.5) inputDiarias.value = (value - 0.5).toFixed(1);
          atualizarTotalDiarias();
        });

        incrementButton.addEventListener("click", () => {
          let value = parseFloat(inputDiarias.value) || 0;
          inputDiarias.value = (value + 0.5).toFixed(1);
          atualizarTotalDiarias();
        });

        inputDiarias.addEventListener("input", atualizarTotalDiarias);

        inputContainer.appendChild(decrementButton);
        inputContainer.appendChild(inputDiarias);
        inputContainer.appendChild(incrementButton);
        divDiarias.appendChild(labelDiarias);
        divDiarias.appendChild(inputContainer);

        // Campo de Estados
        const divEstados = document.createElement("div");
        divEstados.classList.add("flex-1");
        const labelEstados = document.createElement("label");
        labelEstados.innerHTML = `Selecione os Estados`;
        labelEstados.classList.add(
          "block",
          "text-gray-700",
          "text-sm",
          "font-bold",
          "mb-2"
        );

        const estadosContainer = document.createElement("div");
        estadosContainer.id = `estadosContainer-${i}`;
        estadosContainer.classList.add("mt-2");

        // Adiciona os checkboxes dinamicamente
        await adicionarCheckboxEstados(estadosContainer);

        divEstados.appendChild(labelEstados);
        divEstados.appendChild(estadosContainer);

        // Adicionar os campos ao container
        containerDiv.appendChild(divSelect);
        containerDiv.appendChild(divDiarias);
        containerDiv.appendChild(divEstados);
        cargoParticipantesDiv.appendChild(containerDiv);
      }

      atualizarTotalDiarias();
    }
  },
};

// Função para buscar os estados do IBGE
async function fetchEstadosIBGE() {
  const response = await fetch(
    "https://servicodados.ibge.gov.br/api/v1/localidades/municipios"
  );
  if (!response.ok) throw new Error("Erro ao buscar estados do IBGE");
  const estados = await response.json();
  return estados.sort((a, b) => a.nome.localeCompare(b.nome));
}

// Função para adicionar os checkboxes de estados
async function adicionarCheckboxEstados(container) {
  try {
    const estados = await fetchEstadosIBGE();
    container.innerHTML = "";

    estados.forEach((estado) => {
      const checkboxContainer = document.createElement("div");
      checkboxContainer.classList.add(
        "flex",
        "items-center",
        "space-x-2",
        "mt-2"
      );

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `estado-${estado.id}`;
      checkbox.value = estado.sigla;
      checkbox.classList.add("form-checkbox", "h-4", "w-4", "text-blue-600");

      const label = document.createElement("checkbox ");
      label.htmlFor = checkbox.id;
      label.textContent = `${estado.nome} - ${estado.microrregiao.mesorregiao.UF.nome}`;
      label.classList.add("text-gray-700", "text-sm", "font-medium");

      checkboxContainer.appendChild(checkbox);
      checkboxContainer.appendChild(label);
      container.appendChild(checkboxContainer);
    });
  } catch (error) {
    console.error("Erro ao carregar os estados:", error);
  }
}

const Helpers = {
  // Formatar moeda
  formatarMoeda(campo) {
    var valor = campo.value;

    valor = valor.replace(/\D/g, "");

    // Adiciona a vírgula para os centavos
    valor = (valor / 100).toFixed(2) + "";
    valor = valor.replace(".", ",");

    // Adiciona os pontos para os milhares
    valor = valor.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    // Atualiza o campo com o valor formatado
    campo.value = `R$${valor}`;
  },
};

// Captura os valores dos cargos
function capturarCargos() {
  const cargoDiv = document.getElementById("cargoParticipantesDiv");
  const cargosJSON = [];
  if (cargoDiv) {
    const camposCargos = cargoDiv.querySelectorAll("select");

    camposCargos.forEach((campo) => {
      const valor = campo.value.trim();
      if (valor) {
        cargosJSON.push(valor); // Adiciona valores não vazios ao array
      }
    });
  }

  return cargosJSON; // Retorna a lista de cargos capturados
}

// Conta os campos de cargos
function contarCargos() {
  const cargoDiv = document.getElementById("cargoParticipantesDiv");

  if (!cargoDiv) {
    console.warn("Div de cargos não encontrada.");
    return 0;
  }

  const camposCargos = cargoDiv.querySelectorAll("input, select, textarea");
  return camposCargos.length; // Retorna a quantidade de campos
}

// Gerencia o indicador de carregamento
function removeLoadingConfig(action) {
  const loadingIndicator = document.getElementById("loading");
  if (!loadingIndicator) {
    console.warn("Indicador de carregamento não encontrado.");
    return;
  }

  if (action === "add") {
    loadingIndicator.classList.add("hidden");
  } else {
    loadingIndicator.classList.remove("hidden");
  }
}

// Pesquisa cidades com base na entrada do usuário
document.getElementById("cidadeEstadoInput")?.addEventListener("input", () => {
  if (typeof API !== "undefined" && API.pesquisarCidades) {
    API.pesquisarCidades();
  } else {
    console.warn("API.pesquisarCidades não está definida.");
  }
});

//Fazer uma função para pegar os valores selecionado na checkbox através da api
function getCheckboxLabelText() {
  const checkboxes = document.querySelectorAll(
    'input[type="checkbox"]:checked'
  );
  const selectedData = Array.from(checkboxes).map((checkbox) => {
    return checkbox.nextElementSibling.textContent.trim();
  });
  return selectedData;
}

// Valida os campos obrigatórios do formulário
function validarCamposObrigatorios(requiredInputs, formulario) {
  let allFieldsValid = true;

  requiredInputs.forEach((id) => {
    const inputField = document.getElementById(id);
    if (inputField) {
      formulario[id] = inputField.value.trim();
      if (!formulario[id]) {
        allFieldsValid = false;
        inputField.classList.add("border-red-500");
      } else {
        inputField.classList.remove("border-red-500");
      }
    }
  });

  return allFieldsValid;
}

// Função principal para lidar com o envio do formulário
document.getElementById("submitBtn").addEventListener("click", async () => {
  // Inicializa o objeto de dados do formulário
  const formulario = {
    preco_diarias: document.getElementById("preco_diarias")?.value || "",
    preco_pass: document.getElementById("preco_pass")?.value || "",
    cargoParticipantes: capturarCargos("cargoParticipantesDiv"),
    cidadesSelecionadas: getCheckboxLabelText(), // Chama sem argumentos
    num_diarias: document.getElementById("num_diarias")?.value || "",
  };

  // Define os campos obrigatórios
  const requiredInputs = [
    "missao",
    "evento",
    "objetivo_missao",
    "justificativa",
    "prioridade",
    "eventual_prej",
    "ambito",
    "cidadesSelecionadas",
    "inicio_miss",
    "term_miss",
    "inicio_desl",
    "term_desl",
    "numeroParticipantes",
    "num_diarias",
  ];

  // Valida os campos obrigatórios
  const allFieldsValid = validarCamposObrigatorios(requiredInputs, formulario);

  if (!allFieldsValid) {
    UI.showFlashAlert(
      "Por favor, preencha todos os campos obrigatórios.",
      "red"
    );
    removeLoadingConfig("add");
    return;
  }

  // Envia os dados ao backend
  try {
    console.log("Dados enviados:", formulario);
    removeLoadingConfig("hidden");

    await window.api.send("toMain", formulario);

    window.api.receive("fromMain", (response) => {
      if (response.toLowerCase().trim() === "true") {
        UI.showFlashAlert("Formulário enviado com sucesso!", "green");
      } else {
        UI.showFlashAlert("Houve um erro ao enviar o formulário.", "red");
      }
      removeLoadingConfig("add");
    });
  } catch (error) {
    console.error("Erro ao enviar formulário:", error);
    UI.showFlashAlert("Ocorreu um erro ao enviar o formulário.", "red");
    removeLoadingConfig("add");
  }
});

document.addEventListener("DOMContentLoaded", () => new PAGES());
