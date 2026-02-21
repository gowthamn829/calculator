// script.js
console.log('Calculator script loaded');

const display = document.getElementById('display');
const previousDisplay = document.getElementById('previous-display');
const themeToggleBtn = document.getElementById('theme-toggle');
const historyToggleBtn = document.getElementById('history-toggle');
const historyPanel = document.getElementById('history-panel');
const historyList = document.getElementById('history-list');
const body = document.body;

let history = JSON.parse(localStorage.getItem('calculator_history')) || [];
let shouldResetDisplay = false;

// Check local storage for theme preference
if (localStorage.getItem('theme') === 'light') {
    body.classList.add('light-theme');
    themeToggleBtn.textContent = '☀️';
}

// Initialize history UI
updateHistoryUI();

function clearDisplay() {
    display.value = '';
    previousDisplay.innerText = '';
}

function deleteLast() {
    if (display.value === 'Error' || display.value === 'Infinity' || display.value === 'NaN') {
        clearDisplay();
        return;
    }
    display.value = display.value.slice(0, -1);
    formatDisplay(); // Re-format after deletion
}

function appendToDisplay(value) {
    if (shouldResetDisplay) {
        // If the user starts typing a number, reset the display
        if (/[0-9.]/.test(value)) {
            display.value = '';
        }
        // If operator, keep the result and append operator
        shouldResetDisplay = false;
    }

    const lastChar = display.value.slice(-1);
    const operators = ['+', '-', '*', '/', '%', '.'];

    // Prevent starting with an operator (except minus or dot)
    if (display.value === '' && operators.includes(value)) {
        if (value === '.' || value === '-') {
            display.value += value;
        }
        return;
    }

    // Prevent double operators
    if (operators.includes(value) && operators.includes(lastChar)) {
        // If both are operators, replace the last one
        // Allow negative numbers after * or / (e.g., 5*-2)
        if (value === '-' && ['*', '/'].includes(lastChar)) {
            display.value += value;
        } else {
            // Replace last operator
            display.value = display.value.slice(0, -1) + value;
        }
    } else {
        display.value += value;
    }
    
    // Format display with commas
    formatDisplay();
}

function formatDisplay() {
    const rawValue = display.value.replace(/,/g, '');
    
    // Split by operators but keep them
    // This regex splits by +, -, *, /, % but keeps delimiters in the array
    const parts = rawValue.split(/([\+\-\*\/%])/g);
    
    const formattedParts = parts.map(part => {
        // Check if part is a number (or decimal number)
        if (/^[0-9.]+$/.test(part)) {
            const numParts = part.split('.');
            // Format integer part
            let integerPart = numParts[0];
            if (integerPart !== '') {
                integerPart = Number(integerPart).toLocaleString('en-US');
            }
            
            // Reconstruct
            if (numParts.length > 1) {
                return integerPart + '.' + numParts[1];
            } else if (part.endsWith('.')) {
                return integerPart + '.';
            } else {
                return integerPart;
            }
        }
        return part;
    });
    
    display.value = formattedParts.join('');
}

function calculate() {
    try {
        // Remove existing commas for calculation
        const cleanExpression = display.value.replace(/,/g, '');
        const result = new Function('return ' + cleanExpression)();
        
        if (!isFinite(result) || isNaN(result)) {
            display.value = 'Error';
            shouldResetDisplay = true; 
        } else {
            // Format the result with commas
            const formattedResult = Number(result).toLocaleString('en-US', { maximumFractionDigits: 10 });
            
            previousDisplay.innerText = display.value + ' =';
            display.value = formattedResult;
            shouldResetDisplay = true;
            addToHistory(display.value, formattedResult);
            
            // Trigger animation
            const container = document.querySelector('.display-container');
            container.classList.add('pop-animation');
            setTimeout(() => {
                container.classList.remove('pop-animation');
            }, 200);
        }
    } catch (error) {
        display.value = 'Error';
        shouldResetDisplay = true;
    }
}

// History Functions
function addToHistory(expression, result) {
    // Avoid adding duplicates or empty calculations
    // expression is typically passed as 'previousDisplay' format (e.g. "1,234 + 567")
    // result is passed formatted (e.g. "1,801")
    
    if (history.length > 0 && history[0].expression === expression) return;
    
    history.unshift({ expression, result });
    if (history.length > 20) history.pop(); // Keep last 20 items
    
    localStorage.setItem('calculator_history', JSON.stringify(history));
    updateHistoryUI();
}

function updateHistoryUI() {
    historyList.innerHTML = '';
    
    if (history.length === 0) {
        historyList.innerHTML = '<div class="history-placeholder">No history yet</div>';
        return;
    }
    
    history.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <span>${item.expression}</span>
            <span>= ${item.result}</span>
        `;
        div.onclick = () => {
            display.value = item.result;
            shouldResetDisplay = true;
            toggleHistory(); // Close panel after selection
        };
        historyList.appendChild(div);
    });
}

function clearHistory() {
    history = [];
    localStorage.removeItem('calculator_history');
    updateHistoryUI();
}

function toggleHistory() {
    historyPanel.classList.toggle('active');
}

// Event Listeners
themeToggleBtn.addEventListener('click', () => {
    // Animate rotation
    themeToggleBtn.style.transform = 'rotate(180deg)';
    
    setTimeout(() => {
        body.classList.toggle('light-theme');
        const isLight = body.classList.contains('light-theme');
        themeToggleBtn.textContent = isLight ? '☀️' : '🌙';
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
        
        // Reset rotation (or keep spinning if I increased deg)
        // Resetting to 0 might snap back if no transition on 0
        // But since I change content, snapping is ok or I can rotate to 360
        themeToggleBtn.style.transform = 'rotate(360deg)';
        
        // Reset to 0 after transition ends to prevent infinite numbers
        setTimeout(() => {
            themeToggleBtn.style.transition = 'none';
            themeToggleBtn.style.transform = 'rotate(0deg)';
            setTimeout(() => {
                themeToggleBtn.style.transition = 'transform 0.3s ease';
            }, 50);
        }, 300);
        
    }, 150);
});

historyToggleBtn.addEventListener('click', toggleHistory);

// Add keyboard support
document.addEventListener('keydown', function(event) {
    const key = event.key;
    
    // Numbers and operators
    if (/[0-9]/.test(key)) {
        appendToDisplay(key);
    } else if (['+', '-', '*', '/', '.', '%'].includes(key)) {
        appendToDisplay(key);
    } else if (key === 'Enter') {
        calculate();
    } else if (key === 'Backspace') {
        deleteLast();
    } else if (key.toLowerCase() === 'h') {
        toggleHistory();
    } else if (key === 'Escape') {
        if (historyPanel.classList.contains('active')) {
            toggleHistory();
        } else {
            clearDisplay();
        }
    }
});