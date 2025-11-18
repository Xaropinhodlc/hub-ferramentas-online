// Aguarda o DOM (estrutura HTML) ser totalmente carregado
document.addEventListener('DOMContentLoaded', () => {

    // --- FUNÇÕES DE UTILIDADE COMPARTILHADAS ---

    // Função auxiliar de formatação monetária (Brasil)
    const formatCurrency = (value) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

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
    
    // --- FUNÇÃO DE ANIMAÇÃO DE RESULTADO (PULSE) ---
    function animateResult(resultElement) {
        if (resultElement) {
            resultElement.classList.add('pulsate');
            setTimeout(() => {
                resultElement.classList.remove('pulsate');
            }, 500);
        }
    }

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
        } else if (historyId === 'history-senha') {
             resultText = ` (Gerada)`;
        }
        return resultText;
    }

    function addToHistory(historyId, equation, result, clickAction = null) {
        const historyList = document.getElementById(historyId);
        if (!historyList) return; // Segurança caso o ID não exista

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

    function _addHistoryItemToDOM(historyId, equation, result, clickAction = null) {
        const historyList = document.getElementById(historyId);
        if (!historyList) return;

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
            navLinks.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            contents.forEach(c => c.classList.remove('active'));

            link.classList.add('active');
            link.setAttribute('aria-selected', 'true');
            
            const contentId = link.getAttribute('data-tab'); 
            const contentEl = document.getElementById(contentId);
            if (contentEl) contentEl.classList.add('active');
        });
    });

    // --- LÓGICA DE LIMPAR HISTÓRICO ---
    document.querySelectorAll('.clear-history-btn').forEach(button => {
        button.addEventListener('click', () => {
            const historyId = button.dataset.historyId;
            if (historyId) {
                clearHistory(historyId);
            }
        });
    });

    // --- LÓGICA DA CALCULADORA PADRÃO ---
    const display = document.getElementById('display');
    const keysContainer = document.getElementById('calculator-keys');
    let currentExpression = ''; 
    
    function setCurrentExpression(value) {
        currentExpression = value;
    }

    function appendToDisplay(value) {
        if (display.value === 'Erro') clearDisplay();
        let visualValue = value;
        if (value === '*') visualValue = '×';
        if (value === '/') visualValue = '÷';
        if (value === '-') visualValue = '−'; 
        display.value += visualValue;
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
            if (['*', '/', '+', '-', '.'].includes(finalExpression.slice(-1))) {
                finalExpression = finalExpression.slice(0, -1);
            }
            const result = new Function('return ' + finalExpression)(); 
            
            let formattedResult = result.toString();
            if (Number.isFinite(result)) {
                formattedResult = parseFloat(result.toFixed(10)).toLocaleString('pt-BR');
            }

            display.value = formattedResult;
            addToHistory('history-padrao', currentExpression.replace(/\*/g, '×').replace(/\//g, '÷').replace(/-/g, '−'), formattedResult);
            setCurrentExpression(result.toString());
            animateResult(display);
        } catch (e) {
            display.value = 'Erro';
            setCurrentExpression('');
            display.style.color = 'var(--error-color)';
        }
    }
    
    if(keysContainer) {
        keysContainer.addEventListener('click', (event) => {
            const target = event.target;
            if (target.tagName !== 'BUTTON') return;

            const value = target.getAttribute('data-value');
            const action = target.getAttribute('data-action');

            if (action === 'clear') {
                clearDisplay();
            } else if (action === 'delete') {
                deleteLast();
            } else if (action === 'calculate') {
                calculateResult();
            } else if (value) {
                appendToDisplay(value);
            }
        });
    }

    // MANIPULADOR DE TECLADO (Unificado)
    document.addEventListener('keydown', (event) => {
        const key = event.key;
        const activeTab = document.querySelector('.tab-content.active');
        const activeElement = document.activeElement;

        if (!activeTab || activeElement.tagName === 'BUTTON') return;
        const activeTabId = activeTab.id;

        // 1. Tratamento da tecla Enter
        if (key === 'Enter' || key === '=') {
            event.preventDefault();
            if (activeTabId === 'padrao') {
                calculateResult();
            } else {
                let targetButtonId = null;
                switch (activeTabId) {
                    case 'porcentagem':
                        if (activeElement.id === 'is-val' || activeElement.id === 'is-total') {
                            targetButtonId = 'btn-calc-is-perc';
                        } else {
                            targetButtonId = 'btn-calc-perc'; 
                        }
                        break;
                    case 'conversor': targetButtonId = 'btn-conv'; break; 
                    case 'imc': targetButtonId = 'btn-calc-imc'; break; 
                    case 'gorjeta': targetButtonId = 'btn-calc-gorjeta'; break; 
                    case 'juros': targetButtonId = 'btn-calc-juros'; break; 
                    case 'combustivel': targetButtonId = 'btn-calc-combustivel'; break; 
                    case 'data': targetButtonId = 'btn-calc-data'; break; 
                    case 'moedas': targetButtonId = 'btn-calc-moedas'; break; 
                    case 'senha': targetButtonId = 'btn-generate-pass'; break;
                }
                if (targetButtonId) {
                    const targetButton = document.getElementById(targetButtonId);
                    if (targetButton) targetButton.click();
                }
            }
            return;
        }

        // 2. Digitação na Calculadora Padrão
        const isInputFocused = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'SELECT';
        if (activeTabId === 'padrao') {
            if (isInputFocused && activeElement !== display) return;
            if ((key >= '0' && key <= '9') || key === '.' || key === '(' || key === ')') {
                appendToDisplay(key); event.preventDefault(); 
            } else if (key === '+' || key === '-' || key === '*' || key === '/') {
                appendToDisplay(key); event.preventDefault();
            } else if (key === 'Backspace') {
                deleteLast(); event.preventDefault();
            } else if (key === 'Delete' || key === 'c' || key === 'C') {
                clearDisplay(); event.preventDefault();
            }
        }
    });

    // --- CARREGAR HISTÓRICOS ---
    const historyIds = ['history-padrao', 'history-porcentagem', 'history-conversor', 'history-imc', 'history-gorjeta', 'history-juros', 'history-combustivel', 'history-data', 'history-moedas', 'history-senha'];
    historyIds.forEach(id => loadHistory(id));
    
    // --- LÓGICA DA CALCULADORA DE PORCENTAGEM ---
    const btnCalcPerc = document.getElementById('btn-calc-perc');
    const percValInput = document.getElementById('perc-val');
    const percTotalInput = document.getElementById('perc-total');
    
    if(btnCalcPerc) {
        btnCalcPerc.addEventListener('click', () => {
            const perc = parseFloat(percValInput.value.replace(',', '.'));
            const total = parseFloat(percTotalInput.value.replace(',', '.'));
            const resultEl = document.getElementById('perc-result');
            if (isNaN(perc) || isNaN(total)) {
                resultEl.textContent = 'Por favor, insira valores válidos.'; return;
            }
            const result = (perc / 100) * total;
            const formattedResult = result.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            resultEl.textContent = `Resultado: ${formattedResult}`;
            addToHistory('history-porcentagem', `${perc}% de ${total}`, formattedResult);
            animateResult(resultEl);
        });
    }

    const btnCalcIsPerc = document.getElementById('btn-calc-is-perc');
    const isValInput = document.getElementById('is-val');
    const isTotalInput = document.getElementById('is-total');

    if(btnCalcIsPerc) {
        btnCalcIsPerc.addEventListener('click', () => {
            const val = parseFloat(isValInput.value.replace(',', '.'));
            const total = parseFloat(isTotalInput.value.replace(',', '.'));
            const resultEl = document.getElementById('is-perc-result');
            if (isNaN(val) || isNaN(total)) {
                resultEl.textContent = 'Por favor, insira valores válidos.'; return;
            }
            if (total === 0) {
                resultEl.textContent = 'Não é possível dividir por zero.'; return;
            }
            const result = (val / total) * 100;
            const formattedResult = result.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
            resultEl.textContent = `Resultado: ${formattedResult}`;
            addToHistory('history-porcentagem', `${val} é qual % de ${total}?`, formattedResult);
            animateResult(resultEl);
        });
    }

    // --- LÓGICA DO CONVERSOR DE UNIDADES ---
    const btnConv = document.getElementById('btn-conv');
    const convInput = document.getElementById('conv-input');

    if(btnConv) {
        btnConv.addEventListener('click', () => {
            const input = parseFloat(convInput.value.replace(',', '.')); 
            const type = document.getElementById('conv-type').value;
            const typeText = document.getElementById('conv-type').options[document.getElementById('conv-type').selectedIndex].text;
            const resultEl = document.getElementById('conv-result');
            if (isNaN(input)) {
                resultEl.textContent = 'Por favor, insira um valor válido.'; return;
            }
            let result = 0; let unit = '';
            switch (type) {
                case 'km-miles': result = input * 0.621371; unit = 'milhas'; break;
                case 'miles-km': result = input / 0.621371; unit = 'km'; break;
                case 'kg-lbs': result = input * 2.20462; unit = 'libras'; break;
                case 'lbs-kg': result = input / 2.20462; unit = 'kg'; break;
                case 'cm-in': result = input * 0.393701; unit = 'polegadas'; break;
                case 'in-cm': result = input / 0.393701; unit = 'cm'; break;
            }
            const formattedResult = `${result.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} ${unit}`;
            resultEl.textContent = `Resultado: ${formattedResult}`;
            addToHistory('history-conversor', `${input} (${typeText})`, formattedResult);
            animateResult(resultEl);
        });
    }

    // --- LÓGICA DA CALCULADORA DE IMC ---
    const btnCalcIMC = document.getElementById('btn-calc-imc');
    const pesoInput = document.getElementById('peso');
    const alturaInput = document.getElementById('altura'); 
    
    if(btnCalcIMC) {
        btnCalcIMC.addEventListener('click', () => {
            const peso = parseFloat(pesoInput.value.replace(',', '.'));
            const altura = parseFloat(alturaInput.value.replace(',', '.'));
            const resultEl = document.getElementById('imc-result');
            pesoInput.closest('.form-group').classList.remove('error');
            alturaInput.closest('.form-group').classList.remove('error');
            resultEl.style.color = 'var(--text-primary)'; 
            
            let isValid = true;
            if (isNaN(peso) || peso <= 0) {
                pesoInput.closest('.form-group').classList.add('error');
                resultEl.textContent = 'Insira um Peso válido.'; isValid = false;
            }
            if (isNaN(altura) || altura <= 0) {
                alturaInput.closest('.form-group').classList.add('error');
                resultEl.textContent = 'Insira uma Altura válida.'; isValid = false;
            }
            if (!isValid) return;

            const imc = peso / (altura * altura);
            let classificacao = ''; let resultColor = 'var(--primary-color)';
            if (imc < 18.5) { classificacao = 'Abaixo do Peso'; resultColor = '#ffc107'; }
            else if (imc < 25) { classificacao = 'Peso Normal'; resultColor = '#28a745'; }
            else if (imc < 30) { classificacao = 'Sobrepeso'; resultColor = '#ffc107'; }
            else if (imc < 35) { classificacao = 'Obesidade Grau I'; resultColor = '#fd7e14'; }
            else { classificacao = 'Obesidade Grau II/III'; resultColor = '#dc3545'; }
            
            const formattedResult = imc.toFixed(2);
            resultEl.textContent = `Seu IMC é ${formattedResult}. Classificação: ${classificacao}`;
            resultEl.style.color = resultColor;
            animateResult(resultEl);
            addToHistory('history-imc', `Peso: ${peso}kg / Altura: ${altura}m`, `${formattedResult} (${classificacao})`);
        });
    }

    // --- LÓGICA DO GERADOR DE SENHA ---
    const passResultInput = document.getElementById('pass-result');
    const passLengthSlider = document.getElementById('pass-length');
    const passLengthValue = document.getElementById('pass-length-value');
    const passUpperCheck = document.getElementById('pass-upper');
    const passLowerCheck = document.getElementById('pass-lower');
    const passNumbersCheck = document.getElementById('pass-numbers');
    const passSymbolsCheck = document.getElementById('pass-symbols');
    const generateBtn = document.getElementById('btn-generate-pass');
    const copyBtn = document.getElementById('btn-copy-pass'); // ID corrigido para corresponder ao HTML
    const passFeedback = document.getElementById('pass-feedback');

    const charsets = { 
        upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 
        lower: 'abcdefghijklmnopqrstuvwxyz', 
        numbers: '0123456789', 
        symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?' 
    };

    if(passLengthSlider) {
        passLengthSlider.addEventListener('input', () => { 
            passLengthValue.textContent = passLengthSlider.value; 
        });
    }

    if(generateBtn) {
        generateBtn.addEventListener('click', () => {
            const length = parseInt(passLengthSlider.value);
            let charset = '';
            let password = '';
            passFeedback.textContent = '';
            passResultInput.style.borderColor = 'var(--text-secondary)'; 

            if (passUpperCheck.checked) charset += charsets.upper;
            if (passLowerCheck.checked) charset += charsets.lower;
            if (passNumbersCheck.checked) charset += charsets.numbers;
            if (passSymbolsCheck.checked) charset += charsets.symbols;

            if (charset === '') {
                passFeedback.textContent = 'Erro: Selecione ao menos um tipo de caractere.';
                passFeedback.style.color = 'var(--error-color)';
                passResultInput.value = '';
                return;
            }

            if (passUpperCheck.checked) password += charsets.upper[Math.floor(Math.random() * charsets.upper.length)];
            if (passLowerCheck.checked) password += charsets.lower[Math.floor(Math.random() * charsets.lower.length)];
            if (passNumbersCheck.checked) password += charsets.numbers[Math.floor(Math.random() * charsets.numbers.length)];
            if (passSymbolsCheck.checked) password += charsets.symbols[Math.floor(Math.random() * charsets.symbols.length)];

            for (let i = password.length; i < length; i++) {
                const randomIndex = Math.floor(Math.random() * charset.length);
                password += charset[randomIndex];
            }

            password = password.split('').sort(() => 0.5 - Math.random()).join('');
            passResultInput.value = password;
            
            // Adiciona ao histórico
            addToHistory('history-senha', `Tam: ${length}`, password);
        });
    }

    if(copyBtn) {
        copyBtn.addEventListener('click', () => {
            const passwordToCopy = passResultInput.value;
            if (!passwordToCopy) {
                passFeedback.textContent = 'Nada para copiar. Gere uma senha primeiro.';
                passFeedback.style.color = 'var(--text-secondary)';
                return;
            }
            navigator.clipboard.writeText(passwordToCopy).then(() => {
                passFeedback.textContent = 'Senha copiada!';
                passFeedback.style.color = 'var(--primary-color)';
            }).catch(err => {
                console.error('Erro ao copiar: ', err);
                passFeedback.textContent = 'Erro ao copiar.';
                passFeedback.style.color = 'var(--error-color)';
            });
        });
    }

    // --- LÓGICA DO GERADOR DE GORJETA E DIVISÃO ---
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
            const contaValor = parseFloat(contaValorInput.value.replace(',', '.')) || 0;
            const numPessoas = parseInt(numPessoasInput.value) || 1;
            const gorjetaPerc = parseInt(gorjetaPercSlider.value) || 0;

            if (contaValor <= 0 || numPessoas <= 0) {
                alert('Por favor, insira valores válidos para a conta e número de pessoas.');
                return;
            }

            const gorjetaValor = contaValor * (gorjetaPerc / 100);
            const totalPagar = contaValor + gorjetaValor;
            const valorPorPessoa = totalPagar / numPessoas;

            gorjetaTotalEl.textContent = formatCurrency(gorjetaValor);
            totalPagarEl.textContent = formatCurrency(totalPagar);
            valorPessoaEl.textContent = formatCurrency(valorPorPessoa);

            const equation = `R$ ${contaValor.toFixed(2)} (${gorjetaPerc}% Gorjeta / ${numPessoas} Pessoas)`;
            const resultHistory = formatCurrency(valorPorPessoa);
            addToHistory('history-gorjeta', equation, resultHistory);
            
            animateResult(valorPessoaEl);
        });
    }

    // --- LÓGICA DO CALCULADOR DE JUROS COMPOSTOS ---
    const jurosCapitalInput = document.getElementById('juros-capital');
    const jurosAporteInput = document.getElementById('juros-aporte');
    const jurosTaxaInput = document.getElementById('juros-taxa');
    const jurosTempoInput = document.getElementById('juros-tempo');
    const btnCalcJuros = document.getElementById('btn-calc-juros');
    
    const jurosInvestidoEl = document.getElementById('juros-investido');
    const jurosLucroEl = document.getElementById('juros-lucro');
    const jurosFinalEl = document.getElementById('juros-final');

    if(btnCalcJuros) {
        btnCalcJuros.addEventListener('click', () => {
            const capital = parseFloat(jurosCapitalInput.value.replace(',', '.')) || 0;
            const aporteMensal = parseFloat(jurosAporteInput.value.replace(',', '.')) || 0;
            const taxaAnual = parseFloat(jurosTaxaInput.value.replace(',', '.')) / 100 || 0;
            const anos = parseInt(jurosTempoInput.value) || 0;

            const meses = anos * 12;
            const taxaMensal = Math.pow(1 + taxaAnual, 1/12) - 1; 

            if (anos <= 0 || (capital <= 0 && aporteMensal <= 0)) {
                alert('Por favor, insira valores válidos para capital inicial, aportes e tempo.');
                return;
            }

            let montante = capital;
            let totalInvestido = capital;

            for (let i = 0; i < meses; i++) {
                montante *= (1 + taxaMensal);
                if (i < meses) {
                    montante += aporteMensal;
                    totalInvestido += aporteMensal;
                }
            }

            const lucro = montante - totalInvestido;

            // Corrigido: Agora usamos os IDs corretos (juros-lucro e juros-final são os mesmos no HTML e JS agora)
            if (jurosInvestidoEl) jurosInvestidoEl.textContent = formatCurrency(totalInvestido);
            if (jurosLucroEl) jurosLucroEl.textContent = formatCurrency(lucro);
            if (jurosFinalEl) jurosFinalEl.textContent = formatCurrency(montante);

            const equation = `C: ${capital} | A: ${aporteMensal} | T: ${(taxaAnual*100).toFixed(1)}% | P: ${anos}a`;
            const resultHistory = formatCurrency(montante);
            addToHistory('history-juros', equation, resultHistory);
            
            animateResult(jurosFinalEl);
        });
    }

    // --- LÓGICA DO CALCULADOR DE CONSUMO DE COMBUSTÍVEL ---
    const combDistanciaInput = document.getElementById('comb-distancia');
    const combRendimentoInput = document.getElementById('comb-rendimento');
    const combPrecoLitroInput = document.getElementById('comb-preco-litro');
    const btnCalcCombustivel = document.getElementById('btn-calc-combustivel');
    const combLitrosEl = document.getElementById('comb-litros');
    const combCustoEl = document.getElementById('comb-custo');

    if(btnCalcCombustivel) {
        btnCalcCombustivel.addEventListener('click', () => {
            const distancia = parseFloat(combDistanciaInput.value.replace(',', '.')) || 0;
            const rendimento = parseFloat(combRendimentoInput.value.replace(',', '.')) || 0;
            const precoLitro = parseFloat(combPrecoLitroInput.value.replace(',', '.')) || 0;

            if (distancia <= 0 || rendimento <= 0 || precoLitro <= 0) {
                alert('Por favor, insira valores válidos para distância, rendimento e preço.');
                return;
            }

            const litrosNecessarios = distancia / rendimento;
            const custoTotal = litrosNecessarios * precoLitro;

            combLitrosEl.textContent = `${litrosNecessarios.toFixed(2).replace('.', ',')} L`;
            combCustoEl.textContent = formatCurrency(custoTotal);

            const equation = `D: ${distancia}km | R: ${rendimento}km/L | P: ${formatCurrency(precoLitro)}`;
            const resultHistory = formatCurrency(custoTotal);
            addToHistory('history-combustivel', equation, resultHistory);
            
            animateResult(combCustoEl);
        });
    }

    // --- LÓGICA DO CALCULADOR DE DATA/IDADE ---
    const dataInicioInput = document.getElementById('data-inicio');
    const dataFimInput = document.getElementById('data-fim');
    const btnCalcData = document.getElementById('btn-calc-data');
    
    // CORREÇÃO DE IDs AQUI: O HTML usa 'data-result-full', não 'data-result-text'
    const dataResultFullEl = document.getElementById('data-result-full');
    const dataResultDiasEl = document.getElementById('data-result-dias');
    const dataResultMesesEl = document.getElementById('data-result-meses');

    function calculateDateDifference(date1Str, date2Str) {
        let d1 = new Date(date1Str + 'T00:00:00');
        let d2 = new Date(date2Str + 'T00:00:00');
        
        if (isNaN(d1) || isNaN(d2)) return null;

        if (d1 > d2) [d1, d2] = [d2, d1];

        let y1 = d1.getFullYear(), m1 = d1.getMonth(), day1 = d1.getDate();
        let y2 = d2.getFullYear(), m2 = d2.getMonth(), day2 = d2.getDate();
        
        let years = y2 - y1;
        let months = m2 - m1;
        let days = day2 - day1;

        if (days < 0) {
            months--;
            const daysInMonthBefore = new Date(y2, m2, 0).getDate(); 
            days += daysInMonthBefore;
        }

        if (months < 0) {
            years--;
            months += 12;
        }

        const diffTime = Math.abs(d2 - d1);
        const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const totalMonths = totalDays / 30.4375;

        return { years, months, days, totalDays, totalMonths };
    }

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    if(btnCalcData) {
        btnCalcData.addEventListener('click', () => {
            const dataInicioStr = dataInicioInput.value;
            const dataFimStr = dataFimInput.value;

            if (!dataInicioStr || !dataFimStr) {
                alert('Por favor, insira as duas datas.');
                return;
            }

            const diff = calculateDateDifference(dataInicioStr, dataFimStr);

            if (!diff) {
                alert('Formato de data inválido.');
                return;
            }

            const anosStr = diff.years === 1 ? 'Ano' : 'Anos';
            const mesesStr = diff.months === 1 ? 'Mês' : 'Meses';
            const diasStr = diff.days === 1 ? 'Dia' : 'Dias';

            const fullResultText = `${diff.years} ${anosStr}, ${diff.months} ${mesesStr}, ${diff.days} ${diasStr}`;
            const diasResultText = `${diff.totalDays.toLocaleString('pt-BR')} Dias`;
            const mesesResultText = `${diff.totalMonths.toFixed(2).toLocaleString('pt-BR')} Meses`;

            // Correção aplicada: Usando a variável correta ligada ao ID correto
            if (dataResultFullEl) dataResultFullEl.textContent = fullResultText;
            if (dataResultDiasEl) dataResultDiasEl.textContent = diasResultText;
            if (dataResultMesesEl) dataResultMesesEl.textContent = mesesResultText;

            const equation = `${formatDate(dataInicioStr)} até ${formatDate(dataFimStr)}`;
            addToHistory('history-data', equation, fullResultText);
            
            animateResult(dataResultDiasEl);
        });
    }

    // --- LÓGICA DO CONVERSOR DE MOEDAS (ONLINE) ---
    const moedaOrigemSelect = document.getElementById('moeda-origem-select');
    const moedaValorInput = document.getElementById('moeda-valor');
    const btnCalcMoedas = document.getElementById('btn-calc-moedas');
    
    const moedaValorOrigemEl = document.getElementById('moeda-valor-origem');
    const moedaResultadoEl = document.getElementById('moeda-resultado');
    const infoTextEl = document.getElementById('moeda-info');

    if(btnCalcMoedas) {
        btnCalcMoedas.addEventListener('click', async () => {
            const valor = parseFloat(moedaValorInput.value.replace(',', '.'));
            const moeda = moedaOrigemSelect.value;
            const moedaLabel = moedaOrigemSelect.options[moedaOrigemSelect.selectedIndex].text;
            
            if (isNaN(valor) || valor <= 0) {
                alert('Por favor, insira um valor válido para conversão.');
                return;
            }

            btnCalcMoedas.textContent = 'Buscando...';
            btnCalcMoedas.classList.add('loading');
            btnCalcMoedas.disabled = true;

            try {
                const response = await fetch(`https://economia.awesomeapi.com.br/last/${moeda}-BRL`);
                
                if (!response.ok) throw new Error('Falha na requisição');

                const data = await response.json();
                const key = `${moeda}BRL`;
                const taxa = parseFloat(data[key].bid); 

                const valorBRL = valor * taxa;

                moedaValorOrigemEl.textContent = `${valor.toFixed(2).toLocaleString('pt-BR')} ${moeda}`;
                moedaResultadoEl.textContent = formatCurrency(valorBRL);

                const equation = `${valor.toFixed(2)} ${moeda} (${moedaLabel})`;
                const resultHistory = formatCurrency(valorBRL);
                
                addToHistory('history-moedas', equation, resultHistory);
                animateResult(moedaResultadoEl);

            } catch (error) {
                console.error("Erro ao buscar cotação:", error);
                alert("Não foi possível obter a cotação atualizada. Verifique sua internet.");
            } finally {
                btnCalcMoedas.textContent = 'Buscar Cotação e Converter';
                btnCalcMoedas.classList.remove('loading');
                btnCalcMoedas.disabled = false;
            }
        });
    }
});