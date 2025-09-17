// Global State
let choices = [];
let isSpinning = false;
let optionCounter = 0;
let updateTimeout;

// Configuration
const CONFIG = {
    SECTION_WIDTH: 110,
    DRIFT_DURATION: 15000, // 15 seconds
    UPDATE_DEBOUNCE: 300,
    SPIN_VELOCITY: 25,
    DECELERATION: 0.995,
    MIN_VELOCITY: 0.5,
    DEFAULT_OPTIONS: ['Team Alpha', 'Team Beta', 'Team Gamma', 'Team Delta', 'Team Echo', 'Team Foxtrot']
};

// Initialization
document.addEventListener('DOMContentLoaded', function() {
    initializeOptions();
    updateFilmStrip();
});

// Option Management
function initializeOptions() {
    CONFIG.DEFAULT_OPTIONS.forEach(option => addOption(option));
}

function addOption(text = '') {
    const container = document.getElementById('optionsContainer');
    const optionId = `option-${optionCounter++}`;
    
    const optionDiv = document.createElement('div');
    optionDiv.className = 'option-item';
    optionDiv.innerHTML = `
        <input 
            type="text" 
            class="option-input" 
            id="${optionId}"
            placeholder="Enter option..." 
            value="${text}"
            maxlength="50"
            oninput="autoUpdateStrip()"
        />
        <button class="delete-option" onclick="removeOption('${optionId}')" title="Remove option">
            ×
        </button>
    `;
    
    container.appendChild(optionDiv);
    
    // Focus on the new input if it's empty
    if (!text) {
        setTimeout(() => {
            document.getElementById(optionId).focus();
        }, 100);
    }

    // Auto-update the strip when adding an option
    setTimeout(autoUpdateStrip, 200);
}

function removeOption(optionId) {
    const optionElement = document.getElementById(optionId);
    if (!optionElement) return;

    const container = document.getElementById('optionsContainer');
    
    // Don't allow removing the last option
    if (container.children.length > 1) {
        // Add a nice removal animation
        optionElement.parentElement.style.transform = 'scale(0.8)';
        optionElement.parentElement.style.opacity = '0';
        setTimeout(() => {
            if (optionElement.parentElement) {
                optionElement.parentElement.remove();
                // Auto-update after removal
                autoUpdateStrip();
            }
        }, 200);
    } else {
        // Flash the last item to indicate it can't be removed
        optionElement.parentElement.style.background = 'rgba(255, 71, 87, 0.2)';
        setTimeout(() => {
            optionElement.parentElement.style.background = 'rgba(255, 255, 255, 0.05)';
        }, 300);
    }
}

function getAllOptions() {
    const inputs = document.querySelectorAll('.option-input');
    return Array.from(inputs)
        .map(input => input.value.trim())
        .filter(value => value.length > 0);
}

// Update Management
function autoUpdateStrip() {
    // Don't auto-update while spinning
    if (isSpinning) return;
    
    // Stop drift during updates
    stopIdleDrift();
    
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() => {
        const currentOptions = getAllOptions();
        if (currentOptions.length > 0) {
            updateFilmStrip();
        }
    }, CONFIG.UPDATE_DEBOUNCE);
}

function updateFilmStrip() {
    const rawChoices = getAllOptions();
    
    if (rawChoices.length === 0) {
        // Clear the strip if no options
        const filmStrip = document.getElementById('filmStrip');
        filmStrip.innerHTML = '';
        document.getElementById('winnerText').textContent = 'Add some options to get started!';
        return;
    }

    // Clean and validate choices
    choices = rawChoices.map(choice => choice.trim()).filter(choice => choice.length > 0);
    
    console.log('Updating film strip with choices:', choices);

    const filmStrip = document.getElementById('filmStrip');
    filmStrip.innerHTML = '';

    // Create multiple repetitions for smooth infinite effect
    const repetitions = Math.max(25, Math.ceil(100 / choices.length));
    const totalSections = choices.length * repetitions;
    
    console.log('Creating sections:', { 
        choicesCount: choices.length, 
        repetitions, 
        totalSections 
    });
    
    for (let i = 0; i < totalSections; i++) {
        const section = document.createElement('div');
        section.className = 'film-section';
        const choiceIndex = i % choices.length;
        const choiceText = choices[choiceIndex];
        
        // Ensure text is set properly
        section.textContent = choiceText;
        section.setAttribute('data-choice', choiceText);
        section.setAttribute('data-index', choiceIndex);
        
        console.log(`Section ${i}: "${choiceText}" (choice ${choiceIndex})`);
        
        filmStrip.appendChild(section);
    }

    // Position the strip
    filmStrip.style.width = (totalSections * CONFIG.SECTION_WIDTH) + 'px';
    filmStrip.style.left = '0px';
    filmStrip.style.transform = 'translateX(0px)';

    // Start the idle drift animation
    startIdleDrift();

    document.getElementById('winnerText').textContent = `Ready to pick from ${choices.length} option${choices.length !== 1 ? 's' : ''}!`;
}

// Animation Management
function startIdleDrift() {
    const filmStrip = document.getElementById('filmStrip');
    if (filmStrip && !isSpinning) {
        // Remove any existing animation classes first
        filmStrip.classList.remove('idle-drift');
        
        // Force a reflow to ensure the class removal takes effect
        filmStrip.offsetHeight;
        
        // Add the idle drift animation
        filmStrip.classList.add('idle-drift');
    }
}

function stopIdleDrift() {
    const filmStrip = document.getElementById('filmStrip');
    if (filmStrip) {
        filmStrip.classList.remove('idle-drift');
    }
}

// Spinning Logic
function startSpin() {
    if (isSpinning) return;
    if (choices.length === 0) {
        alert('⚠️ Please configure the film strip before launching!');
        return;
    }

    isSpinning = true;
    const spinBtn = document.getElementById('spinBtn');
    const filmStrip = document.getElementById('filmStrip');
    const winnerText = document.getElementById('winnerText');

    spinBtn.disabled = true;
    spinBtn.innerHTML = '🎬 <span style="animation: pulse 1s infinite;">SELECTING...</span>';
    winnerText.textContent = '';

    const containerRect = filmStrip.parentElement.getBoundingClientRect();
    const containerCenter = containerRect.width / 2;
    
    // Stop the idle drift animation
    stopIdleDrift();
    
    // Remove any existing transitions and animations
    filmStrip.classList.remove('spinning', 'momentum-spin', 'idle-drift');
    filmStrip.style.transition = 'none';
    
    // Get current position or start from 0
    let currentTransform = filmStrip.style.transform;
    let currentPosition = 0;
    if (currentTransform && currentTransform.includes('translateX')) {
        const match = currentTransform.match(/translateX\(([^)]+)\)/);
        if (match) {
            currentPosition = parseFloat(match[1]);
        }
    }
    
    // Physics parameters
    let velocity = CONFIG.SPIN_VELOCITY;
    const deceleration = CONFIG.DECELERATION;
    const minVelocity = CONFIG.MIN_VELOCITY;
    
    // Random additional distance
    const additionalSpins = 5 + Math.random() * 8; // 5-13 additional full rotations through choices
    
    let animationId;
    
    function animateFrame() {
        // Update position (moving left, so subtract velocity)
        currentPosition -= velocity;
        
        // Apply the movement immediately
        filmStrip.style.transform = `translateX(${currentPosition}px)`;
        
        // Reduce velocity (momentum decay)
        velocity *= deceleration;
        
        // Check if we should stop
        if (velocity <= minVelocity) {
            cancelAnimationFrame(animationId);
            finalizeSpinResult(currentPosition, containerCenter, filmStrip, spinBtn);
            return;
        }
        
        // Continue animation
        animationId = requestAnimationFrame(animateFrame);
    }
    
    // Start the momentum-based animation
    animationId = requestAnimationFrame(animateFrame);
}

function finalizeSpinResult(currentPosition, containerCenter, filmStrip, spinBtn) {
    // Calculate which section should be centered
    const positionAtWindowCenter = Math.abs(currentPosition) + containerCenter;
    const sectionAtCenter = Math.floor(positionAtWindowCenter / CONFIG.SECTION_WIDTH);
    const sectionCenterPosition = (sectionAtCenter * CONFIG.SECTION_WIDTH) + (CONFIG.SECTION_WIDTH / 2);
    const finalPosition = containerCenter - sectionCenterPosition;
    
    console.log('Centering debug:', {
        currentPosition,
        containerCenter,
        positionAtWindowCenter,
        sectionAtCenter,
        sectionCenterPosition,
        finalPosition,
        sectionWidth: CONFIG.SECTION_WIDTH
    });
    
    // Smooth transition to the centered position
    filmStrip.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    filmStrip.style.transform = `translateX(${finalPosition}px)`;
    
    setTimeout(() => {
        // Determine the winner
        const winningIndex = sectionAtCenter % choices.length;
        const winner = choices[winningIndex];

        console.log('Winner:', {
            sectionAtCenter,
            winningIndex,
            winner
        });
        
        // Show the dramatic winner modal with fireworks
        setTimeout(() => {
            showWinnerModal(winner);
        }, 300);
        
        // Reset for next spin
        setTimeout(() => {
            filmStrip.style.transition = 'none';
            isSpinning = false;
            spinBtn.disabled = false;
            spinBtn.innerHTML = '🚀 Launch Again';
            
            // Restart the idle drift after spin completes
            setTimeout(startIdleDrift, 500);
        }, 1000);
    }, 600);
}

// Visual Effects
function createParticle(x, y) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.innerHTML = ['✨', '⭐', '💫', '🎯'][Math.floor(Math.random() * 4)];
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    particle.style.fontSize = (Math.random() * 20 + 15) + 'px';
    particle.style.opacity = '1';
    document.body.appendChild(particle);

    const animation = particle.animate([
        { transform: 'translateY(0px) rotate(0deg)', opacity: 1 },
        { transform: `translateY(-100px) rotate(360deg)`, opacity: 0 }
    ], {
        duration: 2000,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    });

    animation.onfinish = () => particle.remove();
}

function createFirework(x, y) {
    const colors = ['#ff006e', '#8338ec', '#3a86ff', '#06ffa5', '#ffbe0b', '#ff5722'];
    const particleCount = 12;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'firework';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.width = '8px';
        particle.style.height = '8px';
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        particle.style.boxShadow = `0 0 20px ${colors[Math.floor(Math.random() * colors.length)]}`;
        document.body.appendChild(particle);

        const angle = (i / particleCount) * Math.PI * 2;
        const velocity = 100 + Math.random() * 100;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;

        const animation = particle.animate([
            { 
                transform: 'translate(0px, 0px) scale(1)', 
                opacity: 1 
            },
            { 
                transform: `translate(${tx}px, ${ty}px) scale(0)`, 
                opacity: 0 
            }
        ], {
            duration: 1000 + Math.random() * 1000,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        });

        animation.onfinish = () => particle.remove();
    }
}

function createFireworksShow() {
    const fireworkCount = 8;
    for (let i = 0; i < fireworkCount; i++) {
        setTimeout(() => {
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * (window.innerHeight * 0.7) + (window.innerHeight * 0.1);
            createFirework(x, y);
        }, i * 300);
    }
}

// Modal Management
function showWinnerModal(winner) {
    const modal = document.getElementById('winnerModal');
    const winnerName = document.getElementById('modalWinnerName');
    
    winnerName.textContent = winner.toUpperCase();
    modal.classList.add('show');
    
    // Start fireworks show
    createFireworksShow();
    
    // Continue fireworks for dramatic effect
    const fireworkInterval = setInterval(() => {
        createFireworksShow();
    }, 2000);
    
    // Stop fireworks after 6 seconds
    setTimeout(() => {
        clearInterval(fireworkInterval);
    }, 6000);
}

function closeWinnerModal() {
    const modal = document.getElementById('winnerModal');
    modal.classList.remove('show');
}
