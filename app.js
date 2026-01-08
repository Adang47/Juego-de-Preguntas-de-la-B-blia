// ===== CONFIGURACIÓN DE CATEGORÍAS =====
// Para agregar nuevas categorías, simplemente agrega objetos al array
// con el nombre y la ruta del archivo JSON
const CATEGORIES = [
    { name: 'Toda la Bíblia', file: 'data/biblia_general.json' },
    { name: 'Personajes', file: 'data/personajes.json' },
    { name: 'Lugares', file: 'data/lugares.json' },
    { name: 'Milagros', file: 'data/milagros.json' },
    { name: 'Antiguo Testamento', file: 'data/antiguo_testamento.json' },
    { name: 'Nuevo Testamento', file: 'data/nuevo_testamento.json' },
    { name: 'Parábolas', file: 'data/parabolas.json' },
    { name: 'Profetas', file: 'data/profetas.json' },
    // Agrega más categorías aquí siguiendo el mismo formato:
    // { name: 'Nombre de Categoría', file: 'data/archivo.json' }
];

// ===== ESTADO GLOBAL DE LA APLICACIÓN =====
const AppState = {
    currentMode: null,
    allQuestions: [],
    config: {
        categories: [],
        numQuestions: 10,
        timePerQuestion: 25
    },
    gameInstance: null
};

// ===== ELEMENTOS DEL DOM =====
const elements = {
    hero: document.getElementById('hero'),
    modal: document.getElementById('configModal'),
    gameArea: document.getElementById('gameArea'),
    resultsScreen: document.getElementById('resultsScreen'),
    configForm: document.getElementById('configForm'),
    categoriesContainer: document.getElementById('categoriesContainer'),
    numQuestionsInput: document.getElementById('numQuestions'),
    questionsValue: document.getElementById('questionsValue'),
    timePerQuestionInput: document.getElementById('timePerQuestion'),
    timeValue: document.getElementById('timeValue'),
    questionsGroup: document.getElementById('questionsGroup'),
    modalTitle: document.getElementById('modalTitle'),
    closeModal: document.getElementById('closeModal'),
    backButton: document.getElementById('backButton'),
    playAgainButton: document.getElementById('playAgainButton'),
    backToMenuButton: document.getElementById('backToMenuButton')
};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', async () => {
    await loadAllQuestions();
    initializeEventListeners();
    renderCategories();
    updateSliderValues();
});

// ===== CARGA DE PREGUNTAS =====
async function loadAllQuestions() {
    try {
        const promises = CATEGORIES.map(category => 
            fetch(category.file)
                .then(response => response.json())
                .catch(error => {
                    console.error(`Error cargando ${category.file}:`, error);
                    return [];
                })
        );
        
        const results = await Promise.all(promises);
        AppState.allQuestions = results.flat();
        console.log(`${AppState.allQuestions.length} preguntas cargadas`);
    } catch (error) {
        console.error('Error al cargar preguntas:', error);
        alert('Error al cargar las preguntas. Por favor, recarga la página.');
    }
}

// ===== RENDERIZADO DE CATEGORÍAS =====
function renderCategories() {
    elements.categoriesContainer.innerHTML = CATEGORIES.map((category, index) => `
        <div>
            <input type="checkbox" 
                   id="category-${index}" 
                   class="category-checkbox" 
                   value="${category.name}">
            <label for="category-${index}" class="category-label">
                ${category.name}
            </label>
        </div>
    `).join('');
}

// ===== EVENT LISTENERS =====
function initializeEventListeners() {
    // Selección de modo de juego
    document.querySelectorAll('.mode-card').forEach(card => {
        card.addEventListener('click', () => {
            const mode = card.dataset.mode;
            openConfigModal(mode);
        });
    });

    // Modal
    elements.closeModal.addEventListener('click', closeConfigModal);
    elements.modal.addEventListener('click', (e) => {
        if (e.target === elements.modal) {
            closeConfigModal();
        }
    });

    // Formulario de configuración
    elements.configForm.addEventListener('submit', handleConfigSubmit);

    // Sliders
    elements.numQuestionsInput.addEventListener('input', updateSliderValues);
    elements.timePerQuestionInput.addEventListener('input', updateSliderValues);

    // Navegación
    elements.backButton.addEventListener('click', backToMenu);
    elements.playAgainButton.addEventListener('click', restartGame);
    elements.backToMenuButton.addEventListener('click', backToMenu);
}

// ===== CONTROL DEL MODAL =====
function openConfigModal(mode) {
    AppState.currentMode = mode;
    
    // Ajustar título y visibilidad según el modo
    if (mode === 'classic') {
        elements.modalTitle.textContent = 'Configuración - Modo Clásico';
        elements.questionsGroup.style.display = 'block';
    } else {
        elements.modalTitle.textContent = 'Configuración - Modo Jeopardy';
        elements.questionsGroup.style.display = 'none';
    }
    
    elements.modal.classList.add('show');
    resetForm();
}

function closeConfigModal() {
    elements.modal.classList.remove('show');
}

function resetForm() {
    elements.configForm.reset();
    document.getElementById('categoriesError').textContent = '';
    elements.numQuestionsInput.value = 10;
    elements.timePerQuestionInput.value = 25;
    updateSliderValues();
}

// ===== ACTUALIZACIÓN DE VALORES DE SLIDERS =====
function updateSliderValues() {
    elements.questionsValue.textContent = elements.numQuestionsInput.value;
    elements.timeValue.textContent = elements.timePerQuestionInput.value + 's';
}

// ===== MANEJO DEL FORMULARIO =====
function handleConfigSubmit(e) {
    e.preventDefault();
    
    // Obtener categorías seleccionadas
    const selectedCategories = Array.from(
        document.querySelectorAll('.category-checkbox:checked')
    ).map(checkbox => checkbox.value);
    
    // Validar que se haya seleccionado al menos una categoría
    if (selectedCategories.length === 0) {
        document.getElementById('categoriesError').textContent = 
            'Debes seleccionar al menos una categoría';
        return;
    }
    
    // Validar número mínimo de categorías para Jeopardy
    if (AppState.currentMode === 'jeopardy' && selectedCategories.length < 4) {
        document.getElementById('categoriesError').textContent = 
            'Debes seleccionar al menos 4 categorías para el modo Jeopardy';
        return;
    }
    
    // Guardar configuración
    AppState.config = {
        categories: selectedCategories,
        numQuestions: parseInt(elements.numQuestionsInput.value),
        timePerQuestion: parseInt(elements.timePerQuestionInput.value)
    };
    
    closeConfigModal();
    startGame();
}

// ===== INICIO DEL JUEGO =====
function startGame() {
    // Ocultar hero y mostrar área de juego
    elements.hero.classList.add('hidden');
    elements.gameArea.classList.remove('hidden');
    elements.resultsScreen.classList.add('hidden');
    
    // Filtrar preguntas por categorías seleccionadas
    const filteredQuestions = AppState.allQuestions.filter(q => 
        q.categorias.some(cat => AppState.config.categories.includes(cat))
    );
    
    if (filteredQuestions.length === 0) {
        alert('No hay preguntas disponibles para las categorías seleccionadas');
        backToMenu();
        return;
    }
    
    // Iniciar el modo correspondiente
    if (AppState.currentMode === 'classic') {
        AppState.gameInstance = new ClassicGame(filteredQuestions, AppState.config);
    } else {
        AppState.gameInstance = new JeopardyGame(filteredQuestions, AppState.config);
    }
}

// ===== NAVEGACIÓN =====
function backToMenu() {
    // Detener el juego si está activo
    if (AppState.gameInstance && AppState.gameInstance.cleanup) {
        AppState.gameInstance.cleanup();
    }
    
    // Resetear estado
    AppState.currentMode = null;
    AppState.gameInstance = null;
    
    // Mostrar hero y ocultar otras pantallas
    elements.hero.classList.remove('hidden');
    elements.gameArea.classList.add('hidden');
    elements.resultsScreen.classList.add('hidden');
}

function restartGame() {
    elements.resultsScreen.classList.add('hidden');
    openConfigModal(AppState.currentMode);
}

// ===== FUNCIÓN PARA MOSTRAR RESULTADOS =====
function showResults(stats) {
    elements.gameArea.classList.add('hidden');
    elements.resultsScreen.classList.remove('hidden');
    
    const accuracy = stats.totalQuestions > 0 
        ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100) 
        : 0;
    
    document.getElementById('finalScore').textContent = stats.score;
    document.getElementById('correctAnswers').textContent = stats.correctAnswers;
    document.getElementById('incorrectAnswers').textContent = stats.incorrectAnswers;
    document.getElementById('accuracy').textContent = accuracy + '%';
}

// Exponer función globalmente para que los modos de juego la usen
window.showResults = showResults;