// Vibe Bot Website JavaScript
// Built 24/7 live on Twitch with the community

// ============================================
// Smooth Scrolling
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            // Close mobile menu if open
            const navLinks = document.querySelector('.nav-links');
            const mobileToggle = document.getElementById('mobileMenuToggle');
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                mobileToggle.classList.remove('active');
            }
        }
    });
});

// Navbar background on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
    }
});

// Animate elements on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all cards
document.querySelectorAll('.story-card, .feature-card, .command-category').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    observer.observe(card);
});

// ============================================
// Dark Mode Toggle
// ============================================
const darkModeToggle = document.getElementById('darkModeToggle');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

// Load saved theme or use system preference
const savedTheme = localStorage.getItem('theme') || (prefersDark ? 'dark' : 'light');
document.documentElement.setAttribute('data-theme', savedTheme);
updateDarkModeButton(savedTheme);

darkModeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateDarkModeButton(newTheme);
});

function updateDarkModeButton(theme) {
    darkModeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ============================================
// Mobile Menu Toggle
// ============================================
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const navLinks = document.querySelector('.nav-links');

mobileMenuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    mobileMenuToggle.classList.toggle('active');
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.navbar')) {
        navLinks.classList.remove('active');
        mobileMenuToggle.classList.remove('active');
    }
});

// ============================================
// FAQ Accordion
// ============================================
document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
        const faqItem = button.parentElement;
        const isActive = faqItem.classList.contains('active');
        
        // Close all other FAQs
        document.querySelectorAll('.faq-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Toggle current FAQ
        if (!isActive) {
            faqItem.classList.add('active');
        }
    });
});

// ============================================
// Command Search and Filter
// ============================================
const commandSearch = document.getElementById('commandSearch');
const filterButtons = document.querySelectorAll('.filter-btn');
const commandsGrid = document.getElementById('commandsGrid');

// Command data
const commands = [
    { name: 'ban', category: 'moderation', description: 'Ban a user from the server' },
    { name: 'kick', category: 'moderation', description: 'Kick a user from the server' },
    { name: 'warn', category: 'moderation', description: 'Warn a user' },
    { name: 'mute', category: 'moderation', description: 'Mute a user' },
    { name: 'balance', category: 'economy', description: 'Check your balance' },
    { name: 'daily', category: 'economy', description: 'Claim daily rewards' },
    { name: 'work', category: 'economy', description: 'Work to earn money' },
    { name: 'shop', category: 'economy', description: 'Browse the shop' },
    { name: '8ball', category: 'fun', description: 'Ask the magic 8ball' },
    { name: 'meme', category: 'fun', description: 'Generate a random meme' },
    { name: 'pet', category: 'fun', description: 'Manage your virtual pet' },
    { name: 'trivia', category: 'fun', description: 'Play trivia games' },
    { name: 'weather', category: 'utility', description: 'Check the weather' },
    { name: 'translate', category: 'utility', description: 'Translate text' },
    { name: 'serverinfo', category: 'utility', description: 'View server information' },
    { name: 'userinfo', category: 'utility', description: 'View user information' }
];

// Populate commands grid
function populateCommands(filter = 'all', search = '') {
    commandsGrid.innerHTML = '';
    
    const categories = {
        moderation: { icon: '🛡️', title: 'Moderation', commands: [] },
        economy: { icon: '💰', title: 'Economy', commands: [] },
        fun: { icon: '🎮', title: 'Fun', commands: [] },
        utility: { icon: '🔧', title: 'Utility', commands: [] }
    };
    
    // Filter and group commands
    commands.forEach(cmd => {
        if ((filter === 'all' || cmd.category === filter) &&
            (search === '' || cmd.name.toLowerCase().includes(search.toLowerCase()) || 
             cmd.description.toLowerCase().includes(search.toLowerCase()))) {
            categories[cmd.category].commands.push(cmd);
        }
    });
    
    // Create category cards
    Object.entries(categories).forEach(([key, cat]) => {
        if (cat.commands.length > 0 || filter === 'all') {
            const categoryCard = document.createElement('div');
            categoryCard.className = 'command-category';
            categoryCard.setAttribute('data-category', key);
            
            let commandsList = '';
            if (cat.commands.length > 0) {
                commandsList = cat.commands.map(cmd => 
                    `<li><strong>//${cmd.name}</strong> - ${cmd.description}</li>`
                ).join('');
            } else {
                commandsList = '<li>No commands found</li>';
            }
            
            categoryCard.innerHTML = `
                <h3>${cat.icon} ${cat.title} (${cat.commands.length})</h3>
                <ul>${commandsList}</ul>
            `;
            
            commandsGrid.appendChild(categoryCard);
        }
    });
}

// Initialize commands
populateCommands();

// Search functionality
if (commandSearch) {
    commandSearch.addEventListener('input', (e) => {
        const activeFilter = document.querySelector('.filter-btn.active').dataset.category;
        populateCommands(activeFilter, e.target.value);
    });
}

// Filter functionality
filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const searchValue = commandSearch ? commandSearch.value : '';
        populateCommands(btn.dataset.category, searchValue);
    });
});

// ============================================
// Update Stats Dynamically
// ============================================
function updateStats() {
    // Animate numbers counting up
    const animateValue = (element, start, end, duration) => {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const value = Math.floor(progress * (end - start) + start);
            element.textContent = value.toLocaleString();
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    };

    // Example: Fetch real stats from an API
    // For now, using placeholder values
    const serverCount = document.getElementById('serverCount');
    const userCount = document.getElementById('userCount');
    
    if (serverCount && userCount) {
        // Simulate loading
        setTimeout(() => {
            animateValue(serverCount, 0, 0, 1000); // Will be updated when bot is live
            animateValue(userCount, 0, 0, 1000);   // Will be updated when bot is live
        }, 500);
    }
}

// ============================================
// Bot Status Check
// ============================================
function checkBotStatus() {
    const statusElement = document.querySelector('.bot-status');
    
    // Example: Check bot status via API
    // For now, assuming bot is online
    if (statusElement) {
        statusElement.classList.add('online');
        statusElement.textContent = '● Online';
    }
    
    // You can implement real status checking here:
    // fetch('/api/status')
    //     .then(res => res.json())
    //     .then(data => {
    //         if (data.online) {
    //             statusElement.classList.add('online');
    //             statusElement.classList.remove('offline');
    //             statusElement.textContent = '● Online';
    //         } else {
    //             statusElement.classList.add('offline');
    //             statusElement.classList.remove('online');
    //             statusElement.textContent = '● Offline';
    //         }
    //     });
}

// Mobile menu toggle (if needed in future)
function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('active');
}

// Add easter egg for fun
let konamiCode = [];
const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

document.addEventListener('keydown', (e) => {
    konamiCode.push(e.key);
    konamiCode = konamiCode.slice(-10);
    
    if (konamiCode.join('') === konamiSequence.join('')) {
        document.body.style.animation = 'rainbow 2s infinite';
        setTimeout(() => {
            document.body.style.animation = '';
        }, 5000);
    }
});

// Rainbow animation for easter egg
const style = document.createElement('style');
style.textContent = `
    @keyframes rainbow {
        0% { filter: hue-rotate(0deg); }
        100% { filter: hue-rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Console message for developers
console.log('%c🎵 Vibe Bot', 'font-size: 40px; font-weight: bold; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;');
console.log('%cBuilt 24/7 live on Twitch with the community!', 'font-size: 16px; color: #9b59b6;');
console.log('%cWatch the journey: https://twitch.tv/projectdraguk', 'font-size: 14px; color: #3498db;');
console.log('%cContribute: https://github.com/Sentinelbot-official/vibebot', 'font-size: 14px; color: #2ecc71;');

// ============================================
// Initialize Everything
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    updateStats();
    checkBotStatus();
    console.log('✅ Vibe Bot website loaded successfully!');
    console.log('💜 Theme:', document.documentElement.getAttribute('data-theme'));
});
