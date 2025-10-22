// Global State
let coinCount = 2;
let isFlipping = false;
let headsCount = 0;
let tailsCount = 0;
let totalFlips = 0;

// Configuration
const CONFIG = {
    FLIP_DURATION_MIN: 1200, // Minimum flip time (1.2 seconds)
    FLIP_DURATION_MAX: 2000, // Maximum flip time (2 seconds)
    CELEBRATION_DURATION: 1000,
    MAX_COINS: 6,
    MIN_COINS: 1,
    STAGGER_DELAY: 150 // Delay between each coin start for cascading effect (milliseconds)
};

// Initialization
document.addEventListener('DOMContentLoaded', function() {
    initializeCoins();
    updateDisplay();
});

// Coin Management
function setCoinCount(count) {
    if (isFlipping) return;
    
    coinCount = Math.max(CONFIG.MIN_COINS, Math.min(CONFIG.MAX_COINS, count));
    
    // Update active button
    document.querySelectorAll('.coin-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    initializeCoins();
}

function initializeCoins() {
    const container = document.getElementById('coinsContainer');
    container.innerHTML = '';
    
    for (let i = 0; i < coinCount; i++) {
        const coin = createCoin(i);
        container.appendChild(coin);
    }
    
    updateResultsDisplay(`${coinCount} coin${coinCount > 1 ? 's' : ''} ready to flip!`);
}

function createCoin(index) {
    const coin = document.createElement('div');
    coin.className = 'coin';
    coin.id = `coin-${index}`;
    
    // Create a single face that will change content
    const coinface = document.createElement('div');
    coinface.className = 'coin-face coin-heads';
    coinface.textContent = 'HEADS';
    coinface.setAttribute('data-side', 'heads');
    
    console.log('Creating coin', index, 'initial text:', coinface.textContent);
    
    coin.appendChild(coinface);
    
    // Add click handler for individual coin flip
    coin.addEventListener('click', () => {
        if (!isFlipping) {
            flipSingleCoin(index);
        }
    });
    
    return coin;
}

// Flipping Logic
function flipAllCoins() {
    if (isFlipping) return;
    
    isFlipping = true;
    const flipBtn = document.getElementById('flipBtn');
    flipBtn.disabled = true;
    flipBtn.innerHTML = '🎲 <span style="animation: pulse 1s infinite;">FLIPPING...</span>';
    
    updateResultsDisplay('Coins are flipping...');
    
    // Start all coins flipping with staggered delays
    const results = [];
    const coins = document.querySelectorAll('.coin');
    const flipTimings = [];
    
    coins.forEach((coin, index) => {
        // Random speed class (1-5)
        const speedClass = `speed-${Math.floor(Math.random() * 5) + 1}`;
        
        // Staggered start delay - each coin starts after the previous
        const startDelay = index * CONFIG.STAGGER_DELAY;
        
        // Calculate duration based on speed class
        const duration = 1200 + (parseInt(speedClass.split('-')[1]) - 1) * 200; // 1.2s to 2.0s
        
        flipTimings.push({
            delay: startDelay,
            duration: duration,
            totalTime: startDelay + duration
        });
        
        setTimeout(() => {
            // Add a subtle anticipation effect before flipping
            coin.style.transform = 'scale(1.1)';
            coin.style.transition = 'transform 0.1s ease';
            
            setTimeout(() => {
                coin.style.transform = 'scale(1)';
                coin.classList.add('flipping', speedClass);
            }, 50);
        }, startDelay);
        
        // Determine random result
        const result = Math.random() < 0.5 ? 'heads' : 'tails';
        results.push(result);
        
        // Set final position before animation ends
        setTimeout(() => {
            setFinalCoinState(coin, result);
        }, startDelay + duration - 100);
    });
    
    // Find the longest total time to know when all coins are done
    const maxTotalTime = Math.max(...flipTimings.map(t => t.totalTime));
    
    // Process results after all animations complete
    setTimeout(() => {
        processFlipResults(results);
        
        // Reset state after celebration
        setTimeout(() => {
            coins.forEach(coin => {
                coin.classList.remove('flipping', 'heads-winner', 'tails-winner', 'speed-1', 'speed-2', 'speed-3', 'speed-4', 'speed-5');
            });
            
            isFlipping = false;
            flipBtn.disabled = false;
            flipBtn.innerHTML = '🚀 Flip Coins';
        }, CONFIG.CELEBRATION_DURATION);
        
    }, maxTotalTime);
}

function flipSingleCoin(coinIndex) {
    if (isFlipping) return;
    
    isFlipping = true;
    const coin = document.getElementById(`coin-${coinIndex}`);
    
    // Random speed and small delay for single coin flip
    const speedClass = `speed-${Math.floor(Math.random() * 5) + 1}`;
    const startDelay = Math.random() * 100; // Small random delay (0-100ms) for natural feel
    const duration = 1200 + (parseInt(speedClass.split('-')[1]) - 1) * 200;
    
    updateResultsDisplay('Coin is flipping...');
    
    setTimeout(() => {
        // Add a subtle anticipation effect before flipping
        coin.style.transform = 'scale(1.1)';
        coin.style.transition = 'transform 0.1s ease';
        
        setTimeout(() => {
            coin.style.transform = 'scale(1)';
            coin.classList.add('flipping', speedClass);
        }, 50);
    }, startDelay);
    
    // Determine random result
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    
    // Set final position before animation ends
    setTimeout(() => {
        setFinalCoinState(coin, result);
    }, startDelay + duration - 100);
    
    // Process single result
    setTimeout(() => {
        processFlipResults([result]);
        
        // Add celebration effect
        coin.classList.add(result === 'heads' ? 'heads-winner' : 'tails-winner');
        
        // Reset state
        setTimeout(() => {
            coin.classList.remove('flipping', 'heads-winner', 'tails-winner', speedClass);
            isFlipping = false;
        }, CONFIG.CELEBRATION_DURATION);
        
    }, startDelay + duration);
}

function setFinalCoinState(coin, result) {
    // Get the coin face element
    const coinFace = coin.querySelector('.coin-face');
    
    // Update the coin based on result
    if (result === 'heads') {
        coinFace.className = 'coin-face coin-heads';
        coinFace.textContent = 'HEADS';
        coinFace.setAttribute('data-side', 'heads');
    } else {
        coinFace.className = 'coin-face coin-tails';
        coinFace.textContent = 'TAILS';
        coinFace.setAttribute('data-side', 'tails');
    }
    
    // Set final rotation (even number of half-turns for consistency)
    const finalRotation = 1800; // 10 full rotations
    coin.style.transform = `translateY(0px) rotateX(${finalRotation}deg) scale(1)`;
    coin.style.filter = 'drop-shadow(0 5px 10px rgba(0,0,0,0.3))';
    
    console.log('Final coin state:', result, 'text:', coinFace.textContent);
}

// Results Processing
function processFlipResults(results) {
    let sessionHeads = 0;
    let sessionTails = 0;
    
    results.forEach(result => {
        if (result === 'heads') {
            headsCount++;
            sessionHeads++;
        } else {
            tailsCount++;
            sessionTails++;
        }
        totalFlips++;
    });
    
    // Update statistics with animation
    updateStatWithAnimation('headsCount', headsCount);
    updateStatWithAnimation('tailsCount', tailsCount);
    updateStatWithAnimation('totalCount', totalFlips);
    
    // Create results message
    let message = '';
    if (results.length === 1) {
        message = `Result: ${results[0].toUpperCase()}! 🎉`;
    } else {
        const headsText = sessionHeads === 1 ? '1 Head' : `${sessionHeads} Heads`;
        const tailsText = sessionTails === 1 ? '1 Tail' : `${sessionTails} Tails`;
        
        if (sessionHeads > 0 && sessionTails > 0) {
            message = `Results: ${headsText} & ${tailsText}! 🎯`;
        } else if (sessionHeads > 0) {
            message = `All ${headsText}! 👑 Amazing!`;
        } else {
            message = `All ${tailsText}! ⚔️ Incredible!`;
        }
    }
    
    updateResultsDisplay(message);
    
    // Add celebration particles
    createCelebrationEffects(results);
}

// Display Updates
function updateStatWithAnimation(elementId, newValue) {
    const element = document.getElementById(elementId);
    element.classList.add('updating');
    
    // Update value after brief delay for animation effect
    setTimeout(() => {
        element.textContent = newValue;
        element.classList.remove('updating');
    }, 200);
}

function updateResultsDisplay(message) {
    const resultsText = document.getElementById('resultsText');
    resultsText.textContent = message;
}

function updateDisplay() {
    document.getElementById('headsCount').textContent = headsCount;
    document.getElementById('tailsCount').textContent = tailsCount;
    document.getElementById('totalCount').textContent = totalFlips;
}

// Reset Functionality
function resetCounters() {
    if (isFlipping) return;
    
    // Animate counters going to zero
    updateStatWithAnimation('headsCount', 0);
    updateStatWithAnimation('tailsCount', 0);
    updateStatWithAnimation('totalCount', 0);
    
    // Reset global state
    headsCount = 0;
    tailsCount = 0;
    totalFlips = 0;
    
    // Reset results display
    updateResultsDisplay(`${coinCount} coin${coinCount > 1 ? 's' : ''} ready to flip!`);
    
    // Reset all coins to initial position and heads side
    document.querySelectorAll('.coin').forEach(coin => {
        coin.style.transform = 'translateY(0px) rotateX(0deg) scale(1)';
        coin.style.filter = 'drop-shadow(0 5px 10px rgba(0,0,0,0.3))';
        
        // Reset to heads
        const coinFace = coin.querySelector('.coin-face');
        if (coinFace) {
            coinFace.className = 'coin-face coin-heads';
            coinFace.textContent = 'HEADS';
            coinFace.setAttribute('data-side', 'heads');
        }
    });
    
    // Create reset particle effect
    createResetEffect();
}

// Visual Effects
function createCelebrationEffects(results) {
    const colors = {
        heads: ['#ffd700', '#ffed4e', '#fff700'],
        tails: ['#c0c0c0', '#e8e8e8', '#f0f0f0']
    };
    
    results.forEach((result, index) => {
        setTimeout(() => {
            createParticleExplosion(result, colors[result]);
        }, index * 200);
    });
}

function createParticleExplosion(result, colorArray) {
    const container = document.getElementById('coinsContainer');
    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'celebration-particle';
        particle.innerHTML = result === 'heads' ? 'H' : 'T';
        particle.style.position = 'fixed';
        particle.style.left = centerX + 'px';
        particle.style.top = centerY + 'px';
        particle.style.fontSize = '24px';
        particle.style.fontWeight = '900';
        particle.style.fontFamily = 'Orbitron, monospace';
        particle.style.color = colorArray[0];
        particle.style.textShadow = `0 0 10px ${colorArray[0]}`;
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '1000';
        
        document.body.appendChild(particle);
        
        const angle = (i / 8) * Math.PI * 2;
        const velocity = 100 + Math.random() * 50;
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
            duration: 1000 + Math.random() * 500,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        });
        
        animation.onfinish = () => particle.remove();
    }
}

function createResetEffect() {
    const resetParticles = ['🔄', '✨', '💫', '🌟'];
    
    for (let i = 0; i < 12; i++) {
        setTimeout(() => {
            const particle = document.createElement('div');
            particle.innerHTML = resetParticles[Math.floor(Math.random() * resetParticles.length)];
            particle.style.position = 'fixed';
            particle.style.left = Math.random() * window.innerWidth + 'px';
            particle.style.top = Math.random() * window.innerHeight + 'px';
            particle.style.fontSize = (Math.random() * 20 + 20) + 'px';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '1000';
            particle.style.opacity = '1';
            
            document.body.appendChild(particle);
            
            const animation = particle.animate([
                { 
                    transform: 'translateY(0px) rotate(0deg) scale(1)', 
                    opacity: 1 
                },
                { 
                    transform: 'translateY(-100px) rotate(360deg) scale(0)', 
                    opacity: 0 
                }
            ], {
                duration: 1500,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            });
            
            animation.onfinish = () => particle.remove();
        }, i * 100);
    }
}

// Sound Effects (Optional - using Web Audio API)
function playFlipSound() {
    // Create a simple coin flip sound using Web Audio API
    if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
        const audioContext = new (AudioContext || webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }
}

// Keyboard Shortcuts
document.addEventListener('keydown', function(event) {
    if (event.code === 'Space' && !isFlipping) {
        event.preventDefault();
        flipAllCoins();
    } else if (event.code === 'KeyR' && !isFlipping) {
        event.preventDefault();
        resetCounters();
    } else if (event.code >= 'Digit1' && event.code <= 'Digit6' && !isFlipping) {
        const num = parseInt(event.code.replace('Digit', ''));
        if (num <= CONFIG.MAX_COINS) {
            setCoinCount(num);
            // Update button state
            document.querySelectorAll('.coin-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelector(`.coin-btn:nth-child(${num})`).classList.add('active');
        }
    }
});

// Add tooltip information
function addTooltips() {
    const flipBtn = document.getElementById('flipBtn');
    flipBtn.title = 'Flip all coins (Spacebar)';
    
    const resetBtn = document.querySelector('.reset-btn');
    resetBtn.title = 'Reset statistics (R key)';
    
    document.querySelectorAll('.coin-btn').forEach((btn, index) => {
        btn.title = `Set ${index + 1} coin${index > 0 ? 's' : ''} (${index + 1} key)`;
    });
}

// Initialize tooltips when page loads
document.addEventListener('DOMContentLoaded', function() {
    addTooltips();
});

// Statistics Analysis
function getStatistics() {
    if (totalFlips === 0) return null;
    
    return {
        totalFlips,
        headsCount,
        tailsCount,
        headsPercentage: ((headsCount / totalFlips) * 100).toFixed(1),
        tailsPercentage: ((tailsCount / totalFlips) * 100).toFixed(1),
        streak: getCurrentStreak(),
        longestStreak: getLongestStreak()
    };
}

function getCurrentStreak() {
    // This would require storing flip history - simplified for now
    return 0;
}

function getLongestStreak() {
    // This would require storing flip history - simplified for now
    return 0;
}

// Export functionality for potential future features
window.coinFlipper = {
    flipAll: flipAllCoins,
    reset: resetCounters,
    setCoinCount: setCoinCount,
    getStats: getStatistics,
    isFlipping: () => isFlipping
};
