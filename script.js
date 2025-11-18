// Aguarda o DOM (estrutura HTML) ser totalmente carregado
document.addEventListener('DOMContentLoaded', () => {

    // --- FUNÇÕES DE UTILIDADE COMPARTILHADAS ---

    // Função auxiliar de formatação monetária (Brasil)
    const formatCurrency = (value) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };
    
    // Objeto de taxas de câmbio fixas para o conversor de moedas (fallback)
    const EXCHANGE_RATES_FALLBACK = {
        'USD': 5.25, // Exemplo: 1 USD = 5.25 BRL
        'EUR': 5.70, // Exemplo: 1 EUR = 5.70 BRL
        'GBP': 6.50, // Exemplo: 1 GBP = 6.50 BRL
        'JPY': 0.038,
        'CAD': 3.85,
        'AUD': 3.50,
        'CHF': 5.80,
        'CNY': 0.70,
        'ARS': 0.0055 // Exemplo: 1 ARS = 0.0055 BRL
    };
    
    let EXCHANGE_RATES = { ...EXCHANGE_RATES_FALLBACK };

    // --- LÓGICA DE MODO ESCURO (DARK MODE) ---
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    
    const currentTheme = localStorage.getItem('theme') || 'light';

    function applyTheme(theme) {
        if (theme === 'dark') {
            body.classList.add('dark-mode');
            themeToggle.textContent = '🌙'; 
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.remove('dark-mode');
            themeToggle.textContent = '☀️'; 
            localStorage.setItem('theme', 'light');
        }
    }
    
    applyTheme(currentTheme);

    themeToggle.addEventListener('click', () => {
        const newTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
        applyTheme(newTheme);
    });
    // --- FIM LÓGICA DARK MODE ---
    
    // --- FUNÇÃO DE ANIMAÇÃO DE RESULTADO (PULSE) ---
    function animateResult(resultElement) {
        if (resultElement) {
            resultElement.classList.add('pulsate');
            setTimeout(() => {
                resultElement.classList.remove('pulsate');
            }, 500);
        }
    }
    // --- FIM FUNÇÃO DE ANIMAÇÃO DE RESULTADO ---


    // --- FUNÇÕES GENÉRICAS DE HISTÓRICO (COM PERSISTÊNCIA) ---

    function formatResultText(historyId, result) {
        let resultText = ` = ${result}`;
        if (historyId === 'history-gorjeta') {
            resultText = `Pessoa: ${result}`;
        } else if (historyId === 'history-juros') {
             resultText = `Final: ${result}`;
        } else if (historyId === 'history-combustivel') {
             resultText = `Custo: ${result}`;
        } else if (historyId === 'history-data') { 
             resultText = `Diferença: ${result}`;
        } else if (historyId === 'history-moedas') { 
             resultText = `Convertido: ${result}`;
        }
        return resultText;
    }

    function addToHistory(historyId, equation, result, clickAction = null) {
        const historyList = document.getElementById(historyId);
        const emptyMessage = historyList.querySelector('.history-empty');
        if (emptyMessage) {
            historyList.removeChild(emptyMessage);
        }

        const item = document.createElement('div');
        item.classList.add('history-item');
        
        let resultText = formatResultText(historyId, result);
        item.innerHTML = `<div class="equation">${equation}</div><div class="result-history">${resultText}</div>`;
        if (historyList.firstChild) {
            historyList.insertBefore(item, historyList.firstChild);
        } else {
            historyList.appendChild(item);
        }

        // Salvar no LocalStorage
        try {
            const rawHistory = localStorage.getItem(historyId);
            const historyItems = rawHistory ? JSON.parse(rawHistory) : [];
            historyItems.unshift({ equation: equation, result: result });
            if (historyItems.length > 50) {
                historyItems.pop();
            }
            localStorage.setItem(historyId, JSON.stringify(historyItems));
        } catch (e) {
            console.error("Não foi possível salvar o histórico.", e);
        }
    }
    
    function clearHistory(historyId) {
        const historyList = document.getElementById(historyId);
        historyList.innerHTML = '<p class="history-empty">Nenhum cálculo registrado.</p>';
        localStorage.removeItem(historyId);
    }

    function loadHistory(historyId) {
        const savedHistory = localStorage.getItem(historyId);
        if (!savedHistory) return;

        try {
            const historyItems = JSON.parse(savedHistory);
            for (let i = historyItems.length - 1; i >= 0; i--) {
                const item = historyItems[i];
                let clickAction = null;

                if (historyId === 'history-padrao') {
                    clickAction = () => {
                        if (display) {
                            display.value = item.result;
                        }
                        setCurrentExpression(item.result.toString());
                    };
                }
                
                _addHistoryItemToDOM(historyId, item.equation, item.result, clickAction);
            }
        } catch (e) {
            console.error("Não foi possível carregar o histórico.", e);
            localStorage.removeItem(historyId); 
        }
    }

    // Função auxiliar interna para carregar sem salvar de novo
    function _addHistoryItemToDOM(historyId, equation, result, clickAction = null) {
        const historyList = document.getElementById(historyId);
        const emptyMessage = historyList.querySelector('.history-empty');
        if (emptyMessage) {
            historyList.removeChild(emptyMessage);
        }
        const item = document.createElement('div');
        item.classList.add('history-item');
        
        let resultText = formatResultText(historyId, result);
        item.innerHTML = `<div class="equation">${equation}</div><div class="result-history">${resultText}</div>`;
        if (clickAction) {
            item.addEventListener('click', clickAction);
        }
        if (historyList.firstChild) {
            historyList.insertBefore(item, historyList.firstChild);
        } else {
            historyList.appendChild(item);
        }
    }

    // --- LÓGICA DA NAVEGAÇÃO LATERAL ---
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    const contents = document.querySelectorAll('.tab-content');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            // 1. Desativa todos os links
            navLinks.forEach(t => t.classList.remove('active'));
            // 2. Esconde todos os conteúdos
            contents.forEach(c => c.classList.remove('active'));

            // 3. Ativa o link clicado
            link.classList.add('active');
            // 4. Mostra o conteúdo correspondente
            const contentId = link.getAttribute('data-tab'); 
            document.getElementById(contentId).classList.add('active');
            
            // A lógica de fechar a sidebar em mobile foi removida,
            // pois o novo layout horizontal fica sempre visível no topo.
        });
    });
    // --- FIM LÓGICA DA NAVEGAÇÃO LATERAL ---
    
    // O código do Menu Hamburger (mobile) foi removido.

    // --- LÓGICA DE LIMPAR HISTÓRICO ---
    document.querySelectorAll('.clear-history-btn').forEach(button => {
        button.addEventListener('click', () => {
            const historyId = button.getAttribute('data-history-id');
            if (confirm(`Tem certeza que deseja limpar o histórico de ${historyId.replace('history-', '')}?`)) {
                clearHistory(historyId);
            }
        });
    });
    // --- FIM LÓGICA DE LIMPAR HISTÓRICO ---


    // --- 1. LÓGICA DA CALCULADORA PADRÃO ---
    const display = document.getElementById('display');
    const keys = document.getElementById('calculator-keys');
    let currentExpression = '';
    let resultDisplayed = false;

    // Função para atualizar a expressão e o display, tratando a entrada do usuário
    function setCurrentExpression(newExpression) {
        // Substitui "×" por "*" e "÷" por "/" para avaliação do JavaScript
        let safeExpression = newExpression.replace(/×/g, '*').replace(/÷/g, '/');
        currentExpression = safeExpression;
    }

    // Garante que o usuário veja a expressão amigável (× e ÷) no display
    function updateDisplay(value) {
        // Atualiza apenas o que é exibido, mantendo a expressão interna para o cálculo
        if (resultDisplayed) {
            display.value = '';
            resultDisplayed = false;
        }

        // Se for um operador, use o símbolo amigável
        if (['*', '/'].includes(value)) {
            value = value === '*' ? '×' : '÷';
        }
        
        // Trata ponto decimal e o display
        if (value === '.') {
            // Evita múltiplos pontos consecutivos ou no início se não houver número
            if (display.value.slice(-1) === '.' || display.value === '') {
                // Não faz nada se o último caractere já for ponto ou se o display estiver vazio (o 0 será adicionado automaticamente)
            } else {
                display.value += value;
            }
        } else {
            display.value += value;
        }
        
        setCurrentExpression(currentExpression + value);
        display.style.color = 'var(--text-primary)';
    }

    function clearDisplay() {
        display.value = '';
        setCurrentExpression('');
        display.style.color = 'var(--text-primary)';
    }

    function deleteLast() {
        if (display.value === 'Erro') {
            clearDisplay();
        } else {
            display.value = display.value.slice(0, -1);
            setCurrentExpression(currentExpression.slice(0, -1));
        }
    }

    function calculateResult() {
        try {
            if (currentExpression === '') return;
            
            let finalExpression = currentExpression;
            // Remove operador final se houver
            if (['*', '/', '+', '-', '.'].includes(finalExpression.slice(-1))) {
                finalExpression = finalExpression.slice(0, -1);
            }

            // A forma mais segura de calcular (evitando eval)
            const result = new Function('return ' + finalExpression)();

            // Formatação do resultado (mantendo a precisão, mas evitando notação científica para números pequenos)
            const finalResult = parseFloat(result.toFixed(10)); 
            
            // Exibir no display e no histórico
            display.value = finalResult.toLocaleString('pt-BR');
            addToHistory('history-padrao', display.value.replace(/×/g, '*').replace(/÷/g, '/'), finalResult.toLocaleString('pt-BR'));
            
            setCurrentExpression(finalResult.toString());
            resultDisplayed = true;
            
            animateResult(display); // <--- APLICA ANIMAÇÃO

        } catch (error) {
            display.value = 'Erro';
            display.style.color = 'var(--error-color)';
            setCurrentExpression('');
            resultDisplayed = true;
        }
    }


    if (keys) {
        keys.addEventListener('click', (e) => {
            const { target } = e;
            const value = target.getAttribute('data-value');
            const action = target.getAttribute('data-action');

            if (value) {
                updateDisplay(value);
            } else if (action === 'clear') {
                clearDisplay();
            } else if (action === 'delete') {
                deleteLast();
            } else if (action === 'calculate') {
                calculateResult();
            }
        });
    }

    // Suporte ao teclado (apenas para a calculadora padrão)
    document.addEventListener('keydown', (e) => {
        const key = e.key;

        if (document.getElementById('padrao').classList.contains('active')) {
            // Impede o browser de processar teclas de operação padrão
            if (['/', '*', '-', '+', '='].includes(key) || key === 'Enter') {
                e.preventDefault();
            }

            if (/[0-9]/.test(key) || key === '.') {
                updateDisplay(key);
            } else if (key === '+' || key === '-' || key === '*' || key === '/') {
                updateDisplay(key);
            } else if (key === 'Enter' || key === '=') {
                calculateResult();
            } else if (key === 'Backspace') {
                deleteLast();
            } else if (key.toLowerCase() === 'c') {
                clearDisplay();
            }
        }
    });

    // Carrega o histórico ao iniciar
    loadHistory('history-padrao');
    // --- FIM LÓGICA CALCULADORA PADRÃO ---

    // --- 2. LÓGICA DE PORCENTAGEM ---
    const isValInput = document.getElementById('is-val');
    const isTotalInput = document.getElementById('is-total-input');
    const btnCalcIsPerc = document.getElementById('btn-calc-is-perc');
    const ofPercInput = document.getElementById('of-perc');
    const ofValInput = document.getElementById('of-val');
    const btnCalcOfPerc = document.getElementById('btn-calc-of-perc');


    if(btnCalcIsPerc) {
        btnCalcIsPerc.addEventListener('click', () => {
            const val = parseFloat(isValInput.value.replace(',', '.'));
            const total = parseFloat(isTotalInput.value.replace(',', '.'));
            const resultEl = document.getElementById('is-perc-result');

            if (isNaN(val) || isNaN(total)) {
                resultEl.textContent = 'Por favor, insira valores válidos.';
                return;
            }
            if (total === 0) {
                resultEl.textContent = 'Não é possível dividir por zero.';
                return;
            }

            const result = (val / total) * 100;
            const formattedResult = result.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
            
            resultEl.textContent = `Resultado: ${formattedResult}`;
            addToHistory('history-porcentagem', `${val} é qual % de ${total}?`, formattedResult);
            animateResult(resultEl); // <--- APLICA ANIMAÇÃO
        });
    }

    if(btnCalcOfPerc) {
        btnCalcOfPerc.addEventListener('click', () => {
            const perc = parseFloat(ofPercInput.value.replace(',', '.'));
            const val = parseFloat(ofValInput.value.replace(',', '.'));
            const resultEl = document.getElementById('of-perc-result');

            if (isNaN(perc) || isNaN(val)) {
                resultEl.textContent = 'Por favor, insira valores válidos.';
                return;
            }

            const result = (perc / 100) * val;
            const formattedResult = result.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            
            resultEl.textContent = `Resultado: ${formattedResult}`;
            addToHistory('history-porcentagem', `Qual o valor de ${perc}% de ${val}?`, formattedResult);
            animateResult(resultEl); // <--- APLICA ANIMAÇÃO
        });
    }
    loadHistory('history-porcentagem');
    // --- FIM LÓGICA DE PORCENTAGEM ---

    // --- 3. LÓGICA DO CONVERSOR DE UNIDADES ---
    const btnConv = document.getElementById('btn-conv');
    const convInput = document.getElementById('conv-input');
    const convTypeSelect = document.getElementById('conv-type');
    const convResultEl = document.getElementById('conv-result');

    if(btnConv) {
        btnConv.addEventListener('click', () => {
            const valor = parseFloat(convInput.value.replace(',', '.'));
            const tipo = convTypeSelect.value;
            const tipoLabel = convTypeSelect.options[convTypeSelect.selectedIndex].text;
            let resultado = 0;
            let unidadeDestino = '';

            if (isNaN(valor)) {
                convResultEl.textContent = 'Por favor, insira um valor válido.';
                return;
            }

            // Fatores de conversão (aproximados)
            const factors = {
                'km-miles': 0.621371, 'miles-km': 1.60934,
                'kg-lbs': 2.20462, 'lbs-kg': 0.453592,
                'cm-in': 0.393701, 'in-cm': 2.54
            };

            const [origem, destino] = tipo.split('-');
            resultado = valor * factors[tipo];
            unidadeDestino = destino === 'miles' ? 'milhas' : 
                             destino === 'km' ? 'km' : 
                             destino === 'lbs' ? 'lbs' : 
                             destino === 'kg' ? 'kg' : 
                             destino === 'in' ? 'polegadas' : 
                             'cm';

            const formattedResult = resultado.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
            convResultEl.textContent = `Resultado: ${formattedResult} ${unidadeDestino}`;
            
            addToHistory('history-conversor', `${valor} ${origem} (${tipoLabel})`, `${formattedResult} ${unidadeDestino}`);
            animateResult(convResultEl);
        });
    }
    loadHistory('history-conversor');
    // --- FIM LÓGICA DO CONVERSOR DE UNIDADES ---

    // --- 4. LÓGICA DO IMC ---
    const pesoInput = document.getElementById('peso');
    const alturaInput = document.getElementById('altura');
    const btnCalcIMC = document.getElementById('btn-calc-imc');
    const imcResultEl = document.getElementById('imc-result');

    if(btnCalcIMC) {
        btnCalcIMC.addEventListener('click', () => {
            const peso = parseFloat(pesoInput.value.replace(',', '.'));
            const altura = parseFloat(alturaInput.value.replace(',', '.'));
            const resultEl = document.getElementById('imc-result');

            if (isNaN(peso) || isNaN(altura) || peso <= 0 || altura <= 0) {
                resultEl.textContent = 'Por favor, insira valores válidos.';
                resultEl.style.color = 'var(--error-color)';
                return;
            }

            const imc = peso / (altura * altura);
            let classificacao = '';
            let resultColor = '';

            if (imc < 18.5) {
                classificacao = 'Abaixo do peso';
                resultColor = '#ffc107';
            } else if (imc < 25) {
                classificacao = 'Peso normal';
                resultColor = '#28a745';
            } else if (imc < 30) {
                classificacao = 'Sobrepeso';
                resultColor = '#fd7e14';
            } else if (imc < 35) {
                classificacao = 'Obesidade Grau I';
                resultColor = '#dc3545';
            } else {
                classificacao = 'Obesidade Grau II/III';
                resultColor = '#8b0000';
            }

            const formattedResult = imc.toFixed(2).replace('.', ',');
            resultEl.textContent = `Seu IMC é ${formattedResult}. Classificação: ${classificacao}`;
            resultEl.style.color = resultColor;
            
            animateResult(resultEl); // <--- APLICA ANIMAÇÃO
            addToHistory('history-imc', `Peso: ${peso}kg / Altura: ${altura}m`, `${formattedResult} (${classificacao})`);
        });
    }
    loadHistory('history-imc');
    // --- FIM LÓGICA DO IMC ---

    // --- 5. LÓGICA DO GERADOR DE SENHA ---
    const passResultInput = document.getElementById('pass-result');
    const passLengthSlider = document.getElementById('pass-length');
    const passLengthValue = document.getElementById('pass-length-value');
    const btnGeneratePassword = document.getElementById('btn-generate-password');
    const btnCopyPassword = document.getElementById('btn-copy-password');
    const copyFeedback = document.getElementById('copy-feedback');

    const CHARS = {
        upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lower: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+-=[]{}|;:",.<>/?'
    };

    if(passLengthSlider) {
        passLengthSlider.addEventListener('input', () => {
            passLengthValue.textContent = passLengthSlider.value;
        });
    }

    if(btnGeneratePassword) {
        btnGeneratePassword.addEventListener('click', () => {
            const length = parseInt(passLengthSlider.value);
            const includeUpper = document.getElementById('include-upper').checked;
            const includeLower = document.getElementById('include-lower').checked;
            const includeNumbers = document.getElementById('include-numbers').checked;
            const includeSymbols = document.getElementById('include-symbols').checked;
            
            let charSet = '';
            let password = '';
            
            // Garante que pelo menos um caractere de cada tipo selecionado esteja presente
            let requiredChars = [];

            if (includeUpper) { charSet += CHARS.upper; requiredChars.push(CHARS.upper[Math.floor(Math.random() * CHARS.upper.length)]); }
            if (includeLower) { charSet += CHARS.lower; requiredChars.push(CHARS.lower[Math.floor(Math.random() * CHARS.lower.length)]); }
            if (includeNumbers) { charSet += CHARS.numbers; requiredChars.push(CHARS.numbers[Math.floor(Math.random() * CHARS.numbers.length)]); }
            if (includeSymbols) { charSet += CHARS.symbols; requiredChars.push(CHARS.symbols[Math.floor(Math.random() * CHARS.symbols.length)]); }
            
            if (charSet.length === 0) {
                passResultInput.value = 'Selecione pelo menos um tipo de caractere.';
                return;
            }
            
            // Preenche o restante da senha
            for (let i = requiredChars.length; i < length; i++) {
                const randomIndex = Math.floor(Math.random() * charSet.length);
                password += charSet[randomIndex];
            }
            
            // Mistura os caracteres obrigatórios com os aleatórios
            password = (requiredChars.join('') + password).slice(0, length);
            password = password.split('').sort(() => 0.5 - Math.random()).join('');
            
            passResultInput.value = password;
            passResultInput.style.color = 'var(--text-primary)';
        });
    }

    if(btnCopyPassword) {
        btnCopyPassword.addEventListener('click', () => {
            passResultInput.select();
            passResultInput.setSelectionRange(0, 99999); // Para mobile
            document.execCommand('copy');
            copyFeedback.textContent = 'Copiado!';
            copyFeedback.style.color = 'var(--accent-color)';
            setTimeout(() => {
                copyFeedback.textContent = '';
            }, 1500);
        });
    }

    // Garante que pelo menos uma checkbox esteja marcada ao iniciar
    document.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const checkedCount = document.querySelectorAll('.checkbox-group input[type="checkbox"]:checked').length;
            if (checkedCount === 0) {
                checkbox.checked = true;
                copyFeedback.textContent = 'Pelo menos um tipo deve ser selecionado.';
                copyFeedback.style.color = 'var(--error-color)';
                setTimeout(() => { copyFeedback.textContent = ''; }, 2000);
            } else {
                copyFeedback.textContent = '';
            }
        });
    });
    // --- FIM DA LÓGICA DO GERADOR DE SENHA ---

    // --- 6. LÓGICA DO GERADOR DE GORJETA E DIVISÃO ---
    const contaValorInput = document.getElementById('conta-valor');
    const numPessoasInput = document.getElementById('num-pessoas');
    const gorjetaPercSlider = document.getElementById('gorjeta-perc');
    const gorjetaPercValue = document.getElementById('gorjeta-perc-value');
    const btnCalcGorjeta = document.getElementById('btn-calc-gorjeta');
    const gorjetaTotalEl = document.getElementById('gorjeta-total');
    const totalPagarEl = document.getElementById('total-pagar');
    const valorPessoaEl = document.getElementById('valor-pessoa');

    if(gorjetaPercSlider) {
        gorjetaPercSlider.addEventListener('input', () => {
            gorjetaPercValue.textContent = `${gorjetaPercSlider.value}%`;
        });
    }

    if(btnCalcGorjeta) {
        btnCalcGorjeta.addEventListener('click', () => {
            const contaValor = parseFloat(contaValorInput.value.replace(',', '.'));
            const numPessoas = parseInt(numPessoasInput.value);
            const gorjetaPerc = parseFloat(gorjetaPercSlider.value);

            if (isNaN(contaValor) || isNaN(numPessoas) || contaValor <= 0 || numPessoas <= 0) {
                gorjetaTotalEl.textContent = 'R$ 0,00';
                totalPagarEl.textContent = 'R$ 0,00';
                valorPessoaEl.textContent = 'R$ 0,00';
                alert('Por favor, insira valores válidos.');
                return;
            }

            const gorjetaTotal = contaValor * (gorjetaPerc / 100);
            const totalPagar = contaValor + gorjetaTotal;
            const valorPorPessoa = totalPagar / numPessoas;
            
            // Exibição formatada
            gorjetaTotalEl.textContent = formatCurrency(gorjetaTotal);
            totalPagarEl.textContent = formatCurrency(totalPagar);
            valorPessoaEl.textContent = formatCurrency(valorPorPessoa);
            
            // Histórico
            const equation = `Conta: ${formatCurrency(contaValor)} / ${gorjetaPerc}% / ${numPessoas} Pessoas`;
            const resultHistory = formatCurrency(valorPorPessoa);
            addToHistory('history-gorjeta', equation, resultHistory);

            animateResult(valorPessoaEl); // <--- APLICA ANIMAÇÃO
        });
    }
    loadHistory('history-gorjeta');
    // --- FIM DA LÓGICA DO GERADOR DE GORJETA E DIVISÃO ---

    // --- 7. LÓGICA DO CALCULADOR DE JUROS COMPOSTOS ---
    const jurosInicialInput = document.getElementById('juros-inicial');
    const jurosTaxaInput = document.getElementById('juros-taxa');
    const jurosPeriodoInput = document.getElementById('juros-periodo');
    const btnCalcJuros = document.getElementById('btn-calc-juros');
    const jurosAcumuladoEl = document.getElementById('juros-acumulado');
    const jurosFinalEl = document.getElementById('juros-final');

    if(btnCalcJuros) {
        btnCalcJuros.addEventListener('click', () => {
            const inicial = parseFloat(jurosInicialInput.value.replace(',', '.'));
            const taxaAnual = parseFloat(jurosTaxaInput.value.replace(',', '.'));
            const anos = parseFloat(jurosPeriodoInput.value.replace(',', '.'));

            if (isNaN(inicial) || isNaN(taxaAnual) || isNaN(anos) || inicial < 0 || taxaAnual < 0 || anos <= 0) {
                alert('Por favor, insira valores válidos.');
                jurosAcumuladoEl.textContent = 'R$ 0,00';
                jurosFinalEl.textContent = 'R$ 0,00';
                return;
            }

            // Fórmula: M = C * (1 + i)^t
            const taxaDecimal = taxaAnual / 100;
            const montante = inicial * Math.pow((1 + taxaDecimal), anos);
            const jurosAcumulado = montante - inicial;
            
            // Exibição formatada
            jurosAcumuladoEl.textContent = formatCurrency(jurosAcumulado);
            jurosFinalEl.textContent = formatCurrency(montante);

            // Histórico
            const equation = `I: ${formatCurrency(inicial)} | T: ${taxaAnual}% | P: ${anos}a`;
            const resultHistory = formatCurrency(montante);
            addToHistory('history-juros', equation, resultHistory);
            
            animateResult(jurosFinalEl); // <--- APLICA ANIMAÇÃO
        });
    }
    loadHistory('history-juros');
    // --- FIM DA LÓGICA DO CALCULADOR DE JUROS COMPOSTOS ---

    // --- 8. LÓGICA DO CALCULADOR DE CONSUMO DE COMBUSTÍVEL ---
    const combDistanciaInput = document.getElementById('comb-distancia');
    const combRendimentoInput = document.getElementById('comb-rendimento');
    const combPrecoLitroInput = document.getElementById('comb-preco-litro');
    const btnCalcCombustivel = document.getElementById('btn-calc-combustivel');
    const combLitrosEl = document.getElementById('comb-litros');
    const combCustoEl = document.getElementById('comb-custo');

    if(btnCalcCombustivel) {
        btnCalcCombustivel.addEventListener('click', () => {
            const distancia = parseFloat(combDistanciaInput.value.replace(',', '.'));
            const rendimento = parseFloat(combRendimentoInput.value.replace(',', '.'));
            const precoLitro = parseFloat(combPrecoLitroInput.value.replace(',', '.'));

            if (isNaN(distancia) || isNaN(rendimento) || isNaN(precoLitro) || distancia <= 0 || rendimento <= 0 || precoLitro <= 0) {
                alert('Por favor, insira valores válidos.');
                combLitrosEl.textContent = '0.0 L';
                combCustoEl.textContent = 'R$ 0,00';
                return;
            }

            const litrosNecessarios = distancia / rendimento;
            const custoTotal = litrosNecessarios * precoLitro;

            // Exibição formatada
            combLitrosEl.textContent = `${litrosNecessarios.toFixed(2).replace('.', ',')} L`;
            combCustoEl.textContent = formatCurrency(custoTotal);

            // Histórico
            const equation = `D: ${distancia}km | R: ${rendimento}km/L | P: ${formatCurrency(precoLitro)}`;
            const resultHistory = formatCurrency(custoTotal);
            addToHistory('history-combustivel', equation, resultHistory);

            animateResult(combCustoEl); // <--- APLICA ANIMAÇÃO
        });
    }
    loadHistory('history-combustivel');
    // --- FIM DA LÓGICA DO CALCULADOR DE CONSUMO DE COMBUSTÍVEL ---
    
    // --- 9. LÓGICA DA CALCULADORA DE DATAS ---
    const dataInicioInput = document.getElementById('data-inicio');
    const dataFimInput = document.getElementById('data-fim');
    const btnCalcData = document.getElementById('btn-calc-data');
    const dataResultTextEl = document.getElementById('data-result-text');
    const dataResultDiasEl = document.getElementById('data-result-dias');

    // Define a data final padrão como hoje
    if(dataFimInput) {
        dataFimInput.valueAsDate = new Date();
    }

    // Função que calcula a diferença de tempo e formata
    function calculateTimeDifference(start, end) {
        if (!start || !end) return { years: 0, months: 0, days: 0, totalDays: 0 };
        
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let date1 = new Date(start);
        let date2 = new Date(end);

        // Garante que date1 é a mais antiga para o cálculo
        if (date1 > date2) {
            [date1, date2] = [date2, date1];
        }

        let years = date2.getFullYear() - date1.getFullYear();
        let months = date2.getMonth() - date1.getMonth();
        let days = date2.getDate() - date1.getDate();

        if (days < 0) {
            months--;
            // Calcula o número de dias no mês anterior de date2
            const daysInPreviousMonth = new Date(date2.getFullYear(), date2.getMonth(), 0).getDate();
            days += daysInPreviousMonth;
        }

        if (months < 0) {
            years--;
            months += 12;
        }

        return { years, months, days, totalDays };
    }

    if(btnCalcData) {
        btnCalcData.addEventListener('click', () => {
            const dataInicio = new Date(dataInicioInput.value);
            const dataFim = new Date(dataFimInput.value);
            
            if (isNaN(dataInicio) || isNaN(dataFim) || dataInicioInput.value === '' || dataFimInput.value === '') {
                alert('Por favor, selecione as duas datas.');
                return;
            }

            const diff = calculateTimeDifference(dataInicio, dataFim);
            const resultText = `${diff.years} Anos, ${diff.months} Meses, ${diff.days} Dias`;
            
            dataResultTextEl.textContent = resultText;
            dataResultDiasEl.textContent = `${diff.totalDays.toLocaleString('pt-BR')} Dias`;

            // Histórico
            const equation = `${dataInicioInput.value.split('-').reverse().join('/')} a ${dataFimInput.value.split('-').reverse().join('/')}`;
            addToHistory('history-data', equation, resultText);

            animateResult(dataResultTextEl);
        });
    }
    loadHistory('history-data');
    // --- FIM LÓGICA DA CALCULADORA DE DATAS ---


    // --- 10. LÓGICA DO CONVERSOR DE MOEDAS (API) ---

    // Chave da API (Substitua pela sua)
    // Para fins de demonstração, deixaremos a string vazia para forçar o fallback, 
    // a menos que o usuário tenha inserido uma chave válida na última interação.
    const API_KEY = "SUA_CHAVE_API_AQUI"; 
    const API_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/USD`;


    const moedaOrigemSelect = document.getElementById('moeda-origem-select');
    const moedaValorInput = document.getElementById('moeda-valor');
    const btnCalcMoedas = document.getElementById('btn-calc-moedas');
    
    const moedaValorOrigemEl = document.getElementById('moeda-valor-origem');
    const moedaResultadoEl = document.getElementById('moeda-resultado');
    const infoTextEl = document.querySelector('#moedas .info-text');

    // Função para buscar taxas via API
    async function fetchExchangeRates() {
        if (!API_KEY || API_KEY === "SUA_CHAVE_API_AQUI") {
             console.log("Usando taxas de fallback (fixas). Chave API ausente.");
             EXCHANGE_RATES = { ...EXCHANGE_RATES_FALLBACK };
             infoTextEl.textContent = "*Usando taxas fixas para uso offline/fallback. As taxas em tempo real exigem uma chave API.";
             return;
        }

        try {
            const response = await fetch(API_URL);
            const data = await response.json();

            if (data.result === 'success') {
                // A API retorna taxas em relação à moeda base (USD, configurada na URL).
                // Precisamos inverter a lógica: 1 BRL = X USD.
                const brlRate = data.conversion_rates['BRL'];

                if (brlRate) {
                    const newRates = {};
                    for (const [code, rate] of Object.entries(data.conversion_rates)) {
                        // Calcula a taxa de CÓDIGO para BRL: (RATE_TO_USD / BRL_TO_USD) * BRL_TO_USD = RATE_TO_BRL
                        // Uma abordagem mais direta: BRL_VALUE = USD_VALUE * (1/USD_TO_BRL_RATE)
                        // A taxa que precisamos é: 1 CÓDIGO = X BRL
                        // Taxa (Código/BRL) = (1/USD_TO_CODE) * USD_TO_BRL
                        
                        // Simplificando, se a API retorna 1 USD = X CODE, e 1 USD = Y BRL:
                        // 1 CODE = (Y/X) BRL. Como a base é USD, a API retorna TAXA_CODE e TAXA_BRL
                        // Para converter de CODE para BRL, a taxa é: TAXA_BRL / TAXA_CODE
                        
                        // Taxa 1 USD = X CÓDIGO (Data.conversion_rates[CODE])
                        // Taxa 1 USD = Y BRL (Data.conversion_rates['BRL'])
                        // 1 CÓDIGO = (Y/X) BRL
                        
                        if (code !== 'BRL') {
                            newRates[code] = brlRate / rate;
                        }
                    }
                    
                    EXCHANGE_RATES = newRates;
                    infoTextEl.textContent = "*Taxas obtidas via API em tempo real (base USD).";
                    console.log("Taxas API atualizadas:", EXCHANGE_RATES);
                } else {
                    throw new Error("Taxa BRL não encontrada na resposta da API.");
                }
            } else {
                throw new Error(data['error-type'] || "Erro desconhecido da API.");
            }
        } catch (error) {
            console.error("Erro ao buscar taxas de câmbio da API:", error);
            EXCHANGE_RATES = { ...EXCHANGE_RATES_FALLBACK };
            infoTextEl.textContent = "*Erro ao obter taxas em tempo real. Usando taxas fixas (fallback).";
        }
    }
    
    // Chama a função de busca no carregamento
    fetchExchangeRates();


    if(btnCalcMoedas) {
        btnCalcMoedas.addEventListener('click', () => {
            const valor = parseFloat(moedaValorInput.value.replace(',', '.'));
            const moeda = moedaOrigemSelect.value;
            const moedaLabel = moedaOrigemSelect.options[moedaOrigemSelect.selectedIndex].text;
            
            if (isNaN(valor) || valor <= 0) {
                alert('Por favor, insira um valor válido para conversão.');
                moedaResultadoEl.textContent = formatCurrency(0);
                moedaValorOrigemEl.textContent = `0.00 ${moeda}`;
                return;
            }

            const taxa = EXCHANGE_RATES[moeda];
            
            if (!taxa) {
                 alert('Erro: Moeda de origem não suportada nas taxas (nem API, nem fixas).');
                 return;
            }

            const valorBRL = valor * taxa;

            // EXIBIÇÃO
            moedaValorOrigemEl.textContent = `${valor.toFixed(2).toLocaleString('pt-BR')} ${moeda}`;
            moedaResultadoEl.textContent = formatCurrency(valorBRL);

            // HISTÓRICO
            const equation = `${valor.toFixed(2)} ${moeda} (${moedaLabel})`;
            const resultHistory = formatCurrency(valorBRL);
            
            addToHistory('history-moedas', equation, resultHistory);
            
            animateResult(moedaResultadoEl); // <--- APLICA ANIMAÇÃO
        });
    }
    loadHistory('history-moedas');
    // --- FIM LÓGICA DO CONVERSOR DE MOEDAS (API) ---

});