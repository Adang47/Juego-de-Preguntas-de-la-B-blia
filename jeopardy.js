// ===== MODO JEOPARDY =====
class JeopardyGame {
    constructor(questions, config) {
        this.allQuestions = questions;
        this.config = config;
        this.score = 0;
        this.correctAnswers = 0;
        this.incorrectAnswers = 0;
        this.timer = null;
        this.timeRemaining = config.timePerQuestion;
        this.answered = false;
        this.currentQuestion = null;
        this.completedCells = 0;
        
        // Seleccionar categorías y construir tablero
        this.selectedCategories = this.selectCategories();
        this.board = this.buildBoard();
        this.totalCells = this.selectedCategories.length * 3; // 3 niveles por categoría
        
        // Inicializar UI
        this.initializeUI();
    }

    // ===== SELECCIÓN DE CATEGORÍAS =====
    selectCategories() {
        // Obtener preguntas por categoría seleccionada
        const categoriesMap = {};
        
        this.config.categories.forEach(catName => {
            const questions = this.allQuestions.filter(q => 
                q.categorias.includes(catName)
            );
            if (questions.length > 0) {
                categoriesMap[catName] = questions;
            }
        });

        // Tomar las primeras N categorías configuradas (limitado a 6)
        const availableCategories = Object.keys(categoriesMap);
        const numCategories = Math.min(availableCategories.length, 6);
        
        return availableCategories.slice(0, numCategories).map(name => ({
            name: name,
            questions: categoriesMap[name]
        }));
    }

    // ===== CONSTRUCCIÓN DEL TABLERO =====
    buildBoard() {
        const board = [];
        
        this.selectedCategories.forEach(category => {
            const column = {
                category: category.name,
                cells: [
                    this.assignQuestion(category.questions, 'difícil', 300),
                    this.assignQuestion(category.questions, 'medio', 200),
                    this.assignQuestion(category.questions, 'fácil', 100)
                ]
            };
            board.push(column);
        });

        return board;
    }

    // ===== ASIGNAR PREGUNTA POR DIFICULTAD =====
    assignQuestion(questions, difficulty, points) {
        // Normalizar dificultad para búsqueda
        const normalizedDiff = difficulty.toLowerCase();
        
        // Buscar preguntas de la dificultad especificada
        const filtered = questions.filter(q => {
            const qDiff = q.dificultad.toLowerCase();
            return qDiff === normalizedDiff || 
                   (normalizedDiff === 'facil' && qDiff === 'fácil') ||
                   (normalizedDiff === 'dificil' && qDiff === 'difícil');
        });

        // Si hay preguntas de esa dificultad, tomar una aleatoria
        if (filtered.length > 0) {
            const randomIndex = Math.floor(Math.random() * filtered.length);
            return {
                question: filtered[randomIndex],
                points: points,
                completed: false
            };
        }

        // Si no hay preguntas de esa dificultad, tomar cualquiera
        const randomIndex = Math.floor(Math.random() * questions.length);
        return {
            question: questions[randomIndex],
            points: points,
            completed: false
        };
    }

    // ===== INICIALIZACIÓN DE UI =====
    initializeUI() {
        this.showBoard();
        this.updateScore();
        document.getElementById('progress').textContent = 
            `${this.completedCells}/${this.totalCells}`;
    }

    // ===== MOSTRAR TABLERO =====
    showBoard() {
        const gameContent = document.getElementById('gameContent');
        
        let gridHTML = '<div class="jeopardy-board"><div class="jeopardy-grid">';
        
        // Encabezados de categorías
        this.board.forEach(column => {
            gridHTML += `<div class="jeopardy-category">${column.category}</div>`;
        });
        
        // Celdas de preguntas (3 filas de puntos)
        for (let row = 0; row < 3; row++) {
            this.board.forEach((column, colIndex) => {
                const cell = column.cells[row];
                const cellId = `cell-${colIndex}-${row}`;
                const disabled = cell.completed ? 'disabled' : '';
                
                gridHTML += `
                    <button class="jeopardy-cell" 
                            id="${cellId}" 
                            data-col="${colIndex}" 
                            data-row="${row}"
                            ${disabled}>
                        ${cell.completed ? '✓' : cell.points}
                    </button>
                `;
            });
        }
        
        gridHTML += '</div></div>';
        gameContent.innerHTML = gridHTML;

        // Event listeners para celdas
        document.querySelectorAll('.jeopardy-cell:not([disabled])').forEach(button => {
            button.addEventListener('click', (e) => {
                const col = parseInt(e.target.dataset.col);
                const row = parseInt(e.target.dataset.row);
                this.selectQuestion(col, row);
            });
        });
    }

    // ===== SELECCIONAR PREGUNTA =====
    selectQuestion(col, row) {
        const cell = this.board[col].cells[row];
        this.currentQuestion = {
            cell: cell,
            col: col,
            row: row
        };

        this.showQuestion(cell);
    }

    // ===== MOSTRAR PREGUNTA =====
    showQuestion(cell) {
        this.answered = false;
        this.timeRemaining = this.config.timePerQuestion;
        
        const gameContent = document.getElementById('gameContent');
        const question = cell.question;
        
        gameContent.innerHTML = `
            <div class="question-card">
                <div class="question-header">
                    <span class="question-category">${question.categorias[0]}</span>
                    <span class="question-difficulty ${question.dificultad}">
                        ${this.capitalizeFirst(question.dificultad)} - ${cell.points} puntos
                    </span>
                </div>
                <h3 class="question-text">${question.pregunta}</h3>
                <div class="answers-grid" id="answersGrid"></div>
                <div class="explanation-box hidden" id="explanationBox">
                    <h4>Explicación:</h4>
                    <p id="explanationText"></p>
                </div>
                <button class="btn btn-primary btn-large next-button hidden" id="backToBoard">
                    Volver al Tablero
                </button>
            </div>
        `;

        // Mezclar respuestas
        const answers = this.shuffleAnswers(question);
        this.renderAnswers(answers, question.respuesta_correcta);

        // Event listener para volver al tablero
        document.getElementById('backToBoard').addEventListener('click', () => {
            this.backToBoard();
        });

        // Iniciar temporizador
        this.startTimer();
    }

    // ===== MEZCLAR RESPUESTAS =====
    shuffleAnswers(question) {
        const allAnswers = [
            question.respuesta_correcta,
            ...question.respuestas_incorrectas
        ];
        return allAnswers.sort(() => Math.random() - 0.5);
    }

    // ===== RENDERIZAR RESPUESTAS =====
    renderAnswers(answers, correctAnswer) {
        const answersGrid = document.getElementById('answersGrid');
        answersGrid.innerHTML = answers.map(answer => `
            <button class="answer-button" data-answer="${answer}">
                ${answer}
            </button>
        `).join('');

        answersGrid.querySelectorAll('.answer-button').forEach(button => {
            button.addEventListener('click', () => {
                if (!this.answered) {
                    this.checkAnswer(button.dataset.answer, correctAnswer);
                }
            });
        });
    }

    // ===== VERIFICAR RESPUESTA =====
    checkAnswer(selectedAnswer, correctAnswer) {
        this.answered = true;
        this.stopTimer();

        const buttons = document.querySelectorAll('.answer-button');
        const cell = this.currentQuestion.cell;

        buttons.forEach(button => {
            button.disabled = true;
            
            if (button.dataset.answer === correctAnswer) {
                button.classList.add('correct');
            } else if (button.dataset.answer === selectedAnswer) {
                button.classList.add('incorrect');
            }
        });

        // Calcular puntos
        if (selectedAnswer === correctAnswer) {
            this.correctAnswers++;
            this.score += cell.points;
            this.updateScore();
        } else {
            this.incorrectAnswers++;
        }

        // Marcar celda como completada
        cell.completed = true;
        this.completedCells++;

        // Mostrar explicación
        document.getElementById('explanationText').textContent = cell.question.explicacion;
        document.getElementById('explanationBox').classList.remove('hidden');

        // Mostrar botón para volver al tablero
        document.getElementById('backToBoard').classList.remove('hidden');
    }

    // ===== TEMPORIZADOR =====
    startTimer() {
        this.updateTimer();
        this.timer = setInterval(() => {
            this.timeRemaining--;
            this.updateTimer();

            if (this.timeRemaining <= 0) {
                this.timeOut();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    updateTimer() {
        const timerElement = document.getElementById('timer');
        timerElement.textContent = this.timeRemaining;
        
        if (this.timeRemaining <= 5) {
            timerElement.style.color = '#ef4444';
        } else {
            timerElement.style.color = '#2563eb';
        }
    }

    timeOut() {
        if (!this.answered) {
            this.incorrectAnswers++;
            
            const cell = this.currentQuestion.cell;
            const buttons = document.querySelectorAll('.answer-button');
            
            buttons.forEach(button => {
                button.disabled = true;
                if (button.dataset.answer === cell.question.respuesta_correcta) {
                    button.classList.add('correct');
                }
            });

            // Marcar celda como completada
            cell.completed = true;
            this.completedCells++;

            // Mostrar explicación
            document.getElementById('explanationText').textContent = 
                'Se acabó el tiempo. ' + cell.question.explicacion;
            document.getElementById('explanationBox').classList.remove('hidden');

            // Mostrar botón para volver al tablero
            document.getElementById('backToBoard').classList.remove('hidden');

            this.answered = true;
        }
        this.stopTimer();
    }

    // ===== VOLVER AL TABLERO =====
    backToBoard() {
        this.stopTimer();
        
        // Verificar si el juego terminó
        if (this.completedCells >= this.totalCells) {
            this.endGame();
        } else {
            this.showBoard();
            document.getElementById('progress').textContent = 
                `${this.completedCells}/${this.totalCells}`;
        }
    }

    // ===== ACTUALIZAR PUNTUACIÓN =====
    updateScore() {
        document.getElementById('score').textContent = this.score;
    }

    // ===== FINALIZAR JUEGO =====
    endGame() {
        this.stopTimer();
        window.showResults({
            score: this.score,
            correctAnswers: this.correctAnswers,
            incorrectAnswers: this.incorrectAnswers,
            totalQuestions: this.totalCells
        });
    }

    // ===== LIMPIEZA =====
    cleanup() {
        this.stopTimer();
    }

    // ===== UTILIDADES =====
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}