// ===== MODO CLÁSICO =====
class ClassicGame {
    constructor(questions, config) {
        this.allQuestions = questions;
        this.config = config;
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.correctAnswers = 0;
        this.incorrectAnswers = 0;
        this.timer = null;
        this.timeRemaining = config.timePerQuestion;
        this.answered = false;
        
        // Seleccionar y mezclar preguntas
        this.questions = this.selectRandomQuestions();
        
        // Inicializar UI
        this.initializeUI();
        this.showQuestion();
    }

    // ===== SELECCIÓN DE PREGUNTAS =====
    selectRandomQuestions() {
        const shuffled = [...this.allQuestions].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(this.config.numQuestions, shuffled.length));
    }

    // ===== INICIALIZACIÓN DE UI =====
    initializeUI() {
        const gameContent = document.getElementById('gameContent');
        gameContent.innerHTML = `
            <div class="question-card" id="questionCard">
                <div class="question-header">
                    <span class="question-category" id="questionCategory"></span>
                    <span class="question-difficulty" id="questionDifficulty"></span>
                </div>
                <h3 class="question-text" id="questionText"></h3>
                <div class="answers-grid" id="answersGrid"></div>
                <div class="explanation-box hidden" id="explanationBox">
                    <h4>Explicación:</h4>
                    <p id="explanationText"></p>
                </div>
                <button class="btn btn-primary btn-large next-button hidden" id="nextButton">
                    Siguiente Pregunta
                </button>
            </div>
        `;

        document.getElementById('nextButton').addEventListener('click', () => {
            this.nextQuestion();
        });

        this.updateProgress();
    }

    // ===== MOSTRAR PREGUNTA =====
    showQuestion() {
        if (this.currentQuestionIndex >= this.questions.length) {
            this.endGame();
            return;
        }

        const question = this.questions[this.currentQuestionIndex];
        this.answered = false;
        this.timeRemaining = this.config.timePerQuestion;

        // Actualizar UI
        document.getElementById('questionCategory').textContent = 
            question.categorias[0];
        
        const difficultyElement = document.getElementById('questionDifficulty');
        difficultyElement.textContent = this.capitalizeFirst(question.dificultad);
        difficultyElement.className = 'question-difficulty ' + question.dificultad;

        document.getElementById('questionText').textContent = question.pregunta;

        // Mezclar respuestas
        const answers = this.shuffleAnswers(question);
        this.renderAnswers(answers, question.respuesta_correcta);

        // Ocultar explicación y botón siguiente
        document.getElementById('explanationBox').classList.add('hidden');
        document.getElementById('nextButton').classList.add('hidden');

        // Iniciar temporizador
        this.startTimer();
        this.updateProgress();
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

        // Event listeners para respuestas
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
        const question = this.questions[this.currentQuestionIndex];

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
            const points = this.calculatePoints(question.dificultad);
            this.score += points;
            this.updateScore();
        } else {
            this.incorrectAnswers++;
        }

        // Mostrar explicación
        document.getElementById('explanationText').textContent = question.explicacion;
        document.getElementById('explanationBox').classList.remove('hidden');

        // Mostrar botón siguiente
        const nextButton = document.getElementById('nextButton');
        if (this.currentQuestionIndex < this.questions.length - 1) {
            nextButton.textContent = 'Siguiente Pregunta';
        } else {
            nextButton.textContent = 'Ver Resultados';
        }
        nextButton.classList.remove('hidden');
    }

    // ===== CALCULAR PUNTOS =====
    calculatePoints(difficulty) {
        const basePoints = {
            'fácil': 100,
            'facil': 100,
            'medio': 200,
            'difícil': 300,
            'dificil': 300
        };
        return basePoints[difficulty.toLowerCase()] || 100;
    }

    // ===== SIGUIENTE PREGUNTA =====
    nextQuestion() {
        this.currentQuestionIndex++;
        this.showQuestion();
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
        
        // Cambiar color cuando queda poco tiempo
        if (this.timeRemaining <= 5) {
            timerElement.style.color = '#ef4444';
        } else {
            timerElement.style.color = '#2563eb';
        }
    }

    timeOut() {
        if (!this.answered) {
            this.incorrectAnswers++;
            
            const question = this.questions[this.currentQuestionIndex];
            const buttons = document.querySelectorAll('.answer-button');
            
            buttons.forEach(button => {
                button.disabled = true;
                if (button.dataset.answer === question.respuesta_correcta) {
                    button.classList.add('correct');
                }
            });

            // Mostrar explicación
            document.getElementById('explanationText').textContent = 
                'Se acabó el tiempo. ' + question.explicacion;
            document.getElementById('explanationBox').classList.remove('hidden');

            // Mostrar botón siguiente
            const nextButton = document.getElementById('nextButton');
            if (this.currentQuestionIndex < this.questions.length - 1) {
                nextButton.textContent = 'Siguiente Pregunta';
            } else {
                nextButton.textContent = 'Ver Resultados';
            }
            nextButton.classList.remove('hidden');

            this.answered = true;
        }
        this.stopTimer();
    }

    // ===== ACTUALIZAR UI =====
    updateScore() {
        document.getElementById('score').textContent = this.score;
    }

    updateProgress() {
        document.getElementById('progress').textContent = 
            `${this.currentQuestionIndex + 1}/${this.questions.length}`;
    }

    // ===== FINALIZAR JUEGO =====
    endGame() {
        this.stopTimer();
        window.showResults({
            score: this.score,
            correctAnswers: this.correctAnswers,
            incorrectAnswers: this.incorrectAnswers,
            totalQuestions: this.questions.length
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