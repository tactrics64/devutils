// Register service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// User preferences management
const userPreferences = {
    theme: localStorage.getItem('theme') || 'light',
    fontSize: localStorage.getItem('fontSize') || 'medium',
    lastUsedTools: JSON.parse(localStorage.getItem('lastUsedTools')) || [],
    favoriteTools: JSON.parse(localStorage.getItem('favoriteTools')) || [],
    toolOrder: JSON.parse(localStorage.getItem('toolOrder')) || null
};

function savePreferences() {
    localStorage.setItem('theme', userPreferences.theme);
    localStorage.setItem('fontSize', userPreferences.fontSize);
    localStorage.setItem('lastUsedTools', JSON.stringify(userPreferences.lastUsedTools));
    localStorage.setItem('favoriteTools', JSON.stringify(userPreferences.favoriteTools));
    localStorage.setItem('toolOrder', JSON.stringify(userPreferences.toolOrder));
}

function updateLastUsedTools(toolName) {
    const maxLastUsed = 5;
    userPreferences.lastUsedTools = [toolName, 
        ...userPreferences.lastUsedTools.filter(t => t !== toolName)
    ].slice(0, maxLastUsed);
    savePreferences();
    updateRecentToolsList();
}

function toggleFavoriteTool(toolName) {
    const index = userPreferences.favoriteTools.indexOf(toolName);
    if (index === -1) {
        userPreferences.favoriteTools.push(toolName);
    } else {
        userPreferences.favoriteTools.splice(index, 1);
    }
    savePreferences();
    updateToolCards();
}

function updateFontSize(size) {
    userPreferences.fontSize = size;
    document.documentElement.setAttribute('data-font-size', size);
    savePreferences();
}

// Initialize preferences
document.documentElement.setAttribute('data-theme', userPreferences.theme);
document.documentElement.setAttribute('data-font-size', userPreferences.fontSize);

// Theme handling
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.querySelector('.theme-toggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Set initial theme
    if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && prefersDarkScheme.matches)) {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggle.innerHTML = newTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });
});

// Modal handling
const modal = document.getElementById('tool-modal');
const modalTitle = document.getElementById('modal-title');
const toolContainer = document.getElementById('tool-container');
const closeBtn = document.querySelector('.close');

function openModal(title, content) {
    modalTitle.textContent = title;
    toolContainer.innerHTML = content;
    modal.style.display = 'block';
}

function closeModal() {
    modal.style.display = 'none';
}

closeBtn.onclick = closeModal;
window.onclick = (event) => {
    if (event.target === modal) {
        closeModal();
    }
};

// Tool implementations
const tools = {
    base64: {
        title: 'Base64 Encoder/Decoder',
        content: `
            <div class="input-group">
                <textarea id="base64-input" placeholder="Enter text to encode/decode" rows="5"></textarea>
            </div>
            <div class="input-group">
                <button onclick="tools.base64.encode()">Encode</button>
                <button onclick="tools.base64.decode()">Decode</button>
            </div>
            <div class="input-group">
                <textarea id="base64-output" placeholder="Result" rows="5" readonly></textarea>
            </div>
        `,
        encode: () => {
            const input = document.getElementById('base64-input').value;
            const output = btoa(input);
            document.getElementById('base64-output').value = output;
        },
        decode: () => {
            const input = document.getElementById('base64-input').value;
            try {
                const output = atob(input);
                document.getElementById('base64-output').value = output;
            } catch (e) {
                document.getElementById('base64-output').value = 'Invalid Base64 input';
            }
        }
    },
    
    hash: {
        title: 'Hash Generator',
        content: `
            <div class="input-group">
                <textarea id="hash-input" placeholder="Enter text to hash" rows="5"></textarea>
            </div>
            <div class="input-group">
                <button onclick="tools.hash.generate('MD5')">Generate MD5</button>
                <button onclick="tools.hash.generate('SHA-1')">Generate SHA-1</button>
                <button onclick="tools.hash.generate('SHA-256')">Generate SHA-256</button>
            </div>
            <div class="input-group">
                <textarea id="hash-output" placeholder="Hash result" rows="3" readonly></textarea>
            </div>
        `,
        generate: async (algorithm) => {
            const input = document.getElementById('hash-input').value;
            const encoder = new TextEncoder();
            const data = encoder.encode(input);
            const hashBuffer = await crypto.subtle.digest(algorithm === 'MD5' ? 'SHA-256' : algorithm, data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            document.getElementById('hash-output').value = hashHex;
        }
    },

    uuid: {
        title: 'UUID Generator',
        content: `
            <div class="input-group">
                <button onclick="tools.uuid.generate()">Generate UUID</button>
            </div>
            <div class="input-group">
                <input type="text" id="uuid-output" readonly>
            </div>
        `,
        generate: () => {
            const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
            document.getElementById('uuid-output').value = uuid;
        }
    },

    lorem: {
        title: 'Lorem Ipsum Generator',
        content: `
            <div class="input-group">
                <input type="number" id="lorem-paragraphs" value="1" min="1" max="10" placeholder="Number of paragraphs">
                <button onclick="tools.lorem.generate()">Generate</button>
            </div>
            <div class="input-group">
                <textarea id="lorem-output" rows="10" readonly></textarea>
            </div>
        `,
        generate: () => {
            const paragraphs = document.getElementById('lorem-paragraphs').value;
            const loremText = Array(parseInt(paragraphs)).fill(
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
            ).join('\n\n');
            document.getElementById('lorem-output').value = loremText;
        }
    },

    string: {
        title: 'String Utilities',
        content: `
            <div class="input-group">
                <textarea id="string-input" placeholder="Enter text to transform" rows="5"></textarea>
            </div>
            <div class="input-group">
                <button onclick="tools.string.transform('upper')">UPPERCASE</button>
                <button onclick="tools.string.transform('lower')">lowercase</button>
                <button onclick="tools.string.transform('capitalize')">Capitalize</button>
                <button onclick="tools.string.transform('reverse')">Reverse</button>
            </div>
            <div class="input-group">
                <textarea id="string-output" placeholder="Result" rows="5" readonly></textarea>
            </div>
        `,
        transform: (type) => {
            const input = document.getElementById('string-input').value;
            let output = input;
            
            switch(type) {
                case 'upper':
                    output = input.toUpperCase();
                    break;
                case 'lower':
                    output = input.toLowerCase();
                    break;
                case 'capitalize':
                    output = input.split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join(' ');
                    break;
                case 'reverse':
                    output = input.split('').reverse().join('');
                    break;
            }
            
            document.getElementById('string-output').value = output;
        }
    },

    url: {
        title: 'URL Encoder/Decoder',
        content: `
            <div class="input-group">
                <textarea id="url-input" placeholder="Enter URL to encode/decode" rows="5"></textarea>
            </div>
            <div class="input-group">
                <button onclick="tools.url.encode()">Encode</button>
                <button onclick="tools.url.decode()">Decode</button>
            </div>
            <div class="input-group">
                <textarea id="url-output" placeholder="Result" rows="5" readonly></textarea>
            </div>
        `,
        encode: () => {
            const input = document.getElementById('url-input').value;
            document.getElementById('url-output').value = encodeURIComponent(input);
        },
        decode: () => {
            const input = document.getElementById('url-input').value;
            try {
                document.getElementById('url-output').value = decodeURIComponent(input);
            } catch (e) {
                document.getElementById('url-output').value = 'Invalid URL encoding';
            }
        }
    },

    textanalysis: {
        title: 'Text Analysis',
        content: `
            <div class="input-group">
                <textarea id="text-input" placeholder="Enter text to analyze" rows="5"></textarea>
            </div>
            <div class="input-group">
                <div id="text-stats"></div>
            </div>
            <div class="input-group">
                <button onclick="tools.textanalysis.transform('upper')">UPPERCASE</button>
                <button onclick="tools.textanalysis.transform('lower')">lowercase</button>
                <button onclick="tools.textanalysis.transform('capitalize')">Capitalize</button>
                <button onclick="tools.textanalysis.transform('sentence')">Sentence case</button>
            </div>
        `,
        analyze: () => {
            const input = document.getElementById('text-input').value;
            const chars = input.length;
            const words = input.trim() ? input.trim().split(/\s+/).length : 0;
            const lines = input.split('\n').length;
            document.getElementById('text-stats').innerHTML = `
                Characters: ${chars}<br>
                Words: ${words}<br>
                Lines: ${lines}
            `;
        },
        transform: (type) => {
            const input = document.getElementById('text-input').value;
            let output = input;
            
            switch(type) {
                case 'upper':
                    output = input.toUpperCase();
                    break;
                case 'lower':
                    output = input.toLowerCase();
                    break;
                case 'capitalize':
                    output = input.split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join(' ');
                    break;
                case 'sentence':
                    output = input.toLowerCase().replace(/(^\w|\.\s+\w)/gm, letter => letter.toUpperCase());
                    break;
            }
            
            document.getElementById('text-input').value = output;
            this.analyze();
        }
    },

    baseconverter: {
        title: 'Number Base Converter',
        content: `
            <div class="input-group">
                <input type="text" id="number-input" placeholder="Enter a number">
                <select id="from-base">
                    <option value="2">Binary (2)</option>
                    <option value="10" selected>Decimal (10)</option>
                    <option value="16">Hexadecimal (16)</option>
                </select>
            </div>
            <div class="input-group">
                <button onclick="tools.baseconverter.convert()">Convert</button>
            </div>
            <div class="input-group">
                <div id="conversion-results"></div>
            </div>
        `,
        convert: () => {
            const input = document.getElementById('number-input').value;
            const fromBase = parseInt(document.getElementById('from-base').value);
            
            try {
                const decimal = parseInt(input, fromBase);
                document.getElementById('conversion-results').innerHTML = `
                    Binary: ${decimal.toString(2)}<br>
                    Decimal: ${decimal.toString(10)}<br>
                    Hexadecimal: ${decimal.toString(16).toUpperCase()}<br>
                `;
            } catch (e) {
                document.getElementById('conversion-results').innerHTML = 'Invalid number for selected base';
            }
        }
    },

    jsonformatter: {
        title: 'JSON Formatter',
        content: `
            <div class="input-group">
                <textarea id="json-input" placeholder="Enter JSON to format" rows="10"></textarea>
            </div>
            <div class="input-group">
                <button onclick="tools.jsonformatter.format()">Format JSON</button>
                <button onclick="tools.jsonformatter.minify()">Minify JSON</button>
            </div>
            <div class="input-group">
                <textarea id="json-output" rows="10" readonly></textarea>
            </div>
        `,
        format: () => {
            try {
                const input = document.getElementById('json-input').value;
                const parsed = JSON.parse(input);
                document.getElementById('json-output').value = JSON.stringify(parsed, null, 2);
            } catch (e) {
                document.getElementById('json-output').value = 'Invalid JSON: ' + e.message;
            }
        },
        minify: () => {
            try {
                const input = document.getElementById('json-input').value;
                const parsed = JSON.parse(input);
                document.getElementById('json-output').value = JSON.stringify(parsed);
            } catch (e) {
                document.getElementById('json-output').value = 'Invalid JSON: ' + e.message;
            }
        }
    },

    htmlencoder: {
        title: 'HTML Entity Converter',
        content: `
            <div class="input-group">
                <textarea id="html-input" placeholder="Enter text to encode/decode" rows="5"></textarea>
            </div>
            <div class="input-group">
                <button onclick="tools.htmlencoder.encode()">Encode</button>
                <button onclick="tools.htmlencoder.decode()">Decode</button>
            </div>
            <div class="input-group">
                <textarea id="html-output" rows="5" readonly></textarea>
            </div>
        `,
        encode: () => {
            const input = document.getElementById('html-input').value;
            const div = document.createElement('div');
            div.textContent = input;
            document.getElementById('html-output').value = div.innerHTML;
        },
        decode: () => {
            const input = document.getElementById('html-input').value;
            const div = document.createElement('div');
            div.innerHTML = input;
            document.getElementById('html-output').value = div.textContent;
        }
    },

    colorconverter: {
        title: 'Color Format Converter',
        content: `
            <div class="input-group">
                <input type="color" id="color-picker" value="#000000">
                <input type="text" id="color-input" placeholder="Enter color (any format)">
            </div>
            <div class="input-group">
                <button onclick="tools.colorconverter.convert()">Convert</button>
            </div>
            <div class="input-group">
                <div id="color-output"></div>
            </div>
        `,
        convert: () => {
            const input = document.getElementById('color-input').value;
            const colorPicker = document.getElementById('color-picker');
            
            try {
                // Create temporary div to use CSS color parsing
                const div = document.createElement('div');
                div.style.color = input;
                document.body.appendChild(div);
                const color = window.getComputedStyle(div).color;
                document.body.removeChild(div);
                
                // Parse RGB values
                const [r, g, b] = color.match(/\d+/g).map(Number);
                
                // Convert to HEX
                const hex = '#' + [r, g, b].map(x => {
                    const hex = x.toString(16);
                    return hex.length === 1 ? '0' + hex : hex;
                }).join('');
                
                // Update color picker
                colorPicker.value = hex;
                
                // Display results
                document.getElementById('color-output').innerHTML = `
                    HEX: ${hex}<br>
                    RGB: rgb(${r}, ${g}, ${b})<br>
                    HSL: ${tools.colorconverter.rgbToHsl(r, g, b)}
                `;
            } catch (e) {
                document.getElementById('color-output').innerHTML = 'Invalid color format';
            }
        },
        rgbToHsl: (r, g, b) => {
            r /= 255;
            g /= 255;
            b /= 255;
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            let h, s, l = (max + min) / 2;

            if (max === min) {
                h = s = 0;
            } else {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                h /= 6;
            }

            return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
        }
    },

    markdown: {
        title: 'Markdown Preview',
        content: `
            <div class="input-group">
                <textarea id="markdown-input" placeholder="Enter markdown text" rows="10"></textarea>
            </div>
            <div class="input-group">
                <div id="markdown-preview" class="preview-panel"></div>
            </div>
        `,
        init: () => {
            const input = document.getElementById('markdown-input');
            input.addEventListener('input', () => tools.markdown.preview());
        },
        preview: () => {
            const input = document.getElementById('markdown-input').value;
            const preview = document.getElementById('markdown-preview');
            // Using a simple markdown parser for demonstration
            const html = input
                .replace(/#{3}(.+)/g, '<h3>$1</h3>')
                .replace(/#{2}(.+)/g, '<h2>$1</h2>')
                .replace(/#{1}(.+)/g, '<h1>$1</h1>')
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.+?)\*/g, '<em>$1</em>')
                .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
                .replace(/`(.+?)`/g, '<code>$1</code>')
                .replace(/\n/g, '<br>');
            preview.innerHTML = html;
        }
    },

    cssminifier: {
        title: 'CSS Minifier',
        content: `
            <div class="input-group">
                <textarea id="css-input" placeholder="Enter CSS code" rows="10"></textarea>
            </div>
            <div class="input-group">
                <button onclick="tools.cssminifier.minify()">Minify CSS</button>
                <button onclick="tools.cssminifier.format()">Format CSS</button>
            </div>
            <div class="input-group">
                <textarea id="css-output" rows="10" readonly></textarea>
            </div>
        `,
        minify: () => {
            const input = document.getElementById('css-input').value;
            const minified = input
                .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
                .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                .replace(/\s*([{}:;,])\s*/g, '$1') // Remove spaces around special characters
                .replace(/;\}/g, '}') // Remove unnecessary semicolons
                .trim();
            document.getElementById('css-output').value = minified;
        },
        format: () => {
            const input = document.getElementById('css-input').value;
            let formatted = input
                .replace(/\s+/g, ' ')
                .replace(/{\s*/g, ' {\n    ')
                .replace(/;\s*/g, ';\n    ')
                .replace(/\s*}\s*/g, '\n}\n')
                .replace(/\n\s*\n/g, '\n')
                .replace(/\s*{\s*}/g, ' {}')
                .trim();
            document.getElementById('css-output').value = formatted;
        }
    },

    jwtdecoder: {
        title: 'JWT Decoder',
        content: `
            <div class="input-group">
                <textarea id="jwt-input" placeholder="Enter JWT token" rows="3"></textarea>
            </div>
            <div class="input-group">
                <button onclick="tools.jwtdecoder.decode()">Decode JWT</button>
            </div>
            <div class="input-group">
                <div id="jwt-output" class="json-view"></div>
            </div>
        `,
        decode: () => {
            const input = document.getElementById('jwt-input').value;
            try {
                const [header, payload] = input.split('.').slice(0, 2)
                    .map(part => JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/'))));
                
                document.getElementById('jwt-output').innerHTML = `
                    <h4>Header:</h4>
                    <pre>${JSON.stringify(header, null, 2)}</pre>
                    <h4>Payload:</h4>
                    <pre>${JSON.stringify(payload, null, 2)}</pre>
                `;
            } catch (e) {
                document.getElementById('jwt-output').innerHTML = 'Invalid JWT token';
            }
        }
    },

    regex: {
        title: 'RegEx Tester',
        content: `
            <div class="input-group">
                <input type="text" id="regex-pattern" placeholder="Enter regex pattern">
                <div class="checkbox-group">
                    <label><input type="checkbox" id="regex-global"> Global</label>
                    <label><input type="checkbox" id="regex-insensitive"> Case-insensitive</label>
                    <label><input type="checkbox" id="regex-multiline"> Multiline</label>
                </div>
            </div>
            <div class="input-group">
                <textarea id="regex-input" placeholder="Enter text to test" rows="5"></textarea>
            </div>
            <div class="input-group">
                <button onclick="tools.regex.test()">Test RegEx</button>
            </div>
            <div class="input-group">
                <div id="regex-output"></div>
            </div>
        `,
        test: () => {
            const pattern = document.getElementById('regex-pattern').value;
            const input = document.getElementById('regex-input').value;
            const global = document.getElementById('regex-global').checked;
            const insensitive = document.getElementById('regex-insensitive').checked;
            const multiline = document.getElementById('regex-multiline').checked;
            
            try {
                const flags = (global ? 'g' : '') + (insensitive ? 'i' : '') + (multiline ? 'm' : '');
                const regex = new RegExp(pattern, flags);
                const matches = input.match(regex) || [];
                
                document.getElementById('regex-output').innerHTML = `
                    <div>Matches found: ${matches.length}</div>
                    <pre>${matches.map(m => `"${m}"`).join('\n')}</pre>
                `;
            } catch (e) {
                document.getElementById('regex-output').innerHTML = 'Invalid regular expression: ' + e.message;
            }
        }
    },

    timeconverter: {
        title: 'Time Converter',
        content: `
            <div class="input-group">
                <input type="datetime-local" id="time-input">
            </div>
            <div class="input-group">
                <button onclick="tools.timeconverter.convert()">Convert</button>
            </div>
            <div class="input-group">
                <div id="time-output"></div>
            </div>
        `,
        convert: () => {
            const input = document.getElementById('time-input').value;
            const date = new Date(input);
            
            if (isNaN(date)) {
                document.getElementById('time-output').innerHTML = 'Invalid date';
                return;
            }
            
            const output = {
                'UTC': date.toUTCString(),
                'ISO': date.toISOString(),
                'Local': date.toString(),
                'Unix Timestamp': Math.floor(date.getTime() / 1000),
                'Relative': tools.timeconverter.getRelativeTime(date)
            };
            
            document.getElementById('time-output').innerHTML = Object.entries(output)
                .map(([key, value]) => `<div><strong>${key}:</strong> ${value}</div>`)
                .join('');
        },
        getRelativeTime: (date) => {
            const now = new Date();
            const diff = Math.floor((now - date) / 1000);
            
            if (diff < 60) return 'just now';
            if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
            if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
            if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;
            if (diff < 31536000) return `${Math.floor(diff / 2592000)} months ago`;
            return `${Math.floor(diff / 31536000)} years ago`;
        }
    },

    codebeautifier: {
        title: 'Code Beautifier',
        content: `
            <div class="input-group">
                <select id="code-language">
                    <option value="javascript">JavaScript</option>
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                    <option value="sql">SQL</option>
                </select>
            </div>
            <div class="input-group">
                <textarea id="code-input" placeholder="Enter code to beautify" rows="10"></textarea>
            </div>
            <div class="input-group">
                <button onclick="tools.codebeautifier.beautify()">Beautify Code</button>
            </div>
            <div class="input-group">
                <textarea id="code-output" rows="10" readonly></textarea>
            </div>
        `,
        beautify: () => {
            const input = document.getElementById('code-input').value;
            const language = document.getElementById('code-language').value;
            let output = input;

            try {
                switch (language) {
                    case 'javascript':
                        output = tools.codebeautifier.formatJavaScript(input);
                        break;
                    case 'html':
                        output = tools.codebeautifier.formatHTML(input);
                        break;
                    case 'css':
                        output = tools.cssminifier.format(input);
                        break;
                    case 'sql':
                        output = tools.codebeautifier.formatSQL(input);
                        break;
                }
                document.getElementById('code-output').value = output;
            } catch (e) {
                document.getElementById('code-output').value = 'Error formatting code: ' + e.message;
            }
        },
        formatJavaScript: (code) => {
            return code
                .replace(/{\s*/g, ' {\n  ')
                .replace(/;\s*/g, ';\n  ')
                .replace(/}\s*/g, '\n}\n')
                .replace(/,\s*/g, ', ')
                .replace(/\s*=\s*/g, ' = ')
                .replace(/\(\s*/g, '(')
                .replace(/\s*\)/g, ')')
                .trim();
        },
        formatHTML: (code) => {
            return code
                .replace(/>\s*</g, '>\n<')
                .replace(/(<[^\/].*?>)/g, '$1\n')
                .replace(/(<\/.*?>)/g, '\n$1\n')
                .replace(/\n\s*\n/g, '\n')
                .trim();
        },
        formatSQL: (code) => {
            return code
                .replace(/\s+/g, ' ')
                .replace(/\s*,\s*/g, ',\n  ')
                .replace(/\s*;\s*/g, ';\n')
                .replace(/\s*(\()\s*/g, ' $1')
                .replace(/\s*(\))\s*/g, '$1 ')
                .replace(/(SELECT|FROM|WHERE|GROUP BY|HAVING|ORDER BY|LIMIT)/gi, '\n$1')
                .trim();
        }
    },
};

// Add click handlers for tool cards
document.querySelectorAll('.tool-card').forEach((card, index) => {
    const toolName = card.dataset.tool;
    
    // Add favorite button handler
    const favoriteBtn = card.querySelector('.favorite-btn');
    favoriteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavoriteTool(toolName);
        const icon = favoriteBtn.querySelector('i');
        icon.classList.toggle('fas');
        icon.classList.toggle('far');
        card.classList.toggle('favorite');
    });

    // Initialize favorite status
    if (userPreferences.favoriteTools.includes(toolName)) {
        card.classList.add('favorite');
        const icon = favoriteBtn.querySelector('i');
        icon.classList.remove('far');
        icon.classList.add('fas');
    }

    // Tool card click handler
    card.addEventListener('click', () => {
        const tool = tools[toolName];
        if (tool) {
            updateLastUsedTools(toolName);
            openModal(tool.title, tool.content);
            if (tool.init) {
                tool.init();
            }
        }
    });
});

// Font size controls
document.querySelectorAll('.font-size-btn').forEach(btn => {
    const size = btn.dataset.size;
    if (size === userPreferences.fontSize) {
        btn.classList.add('active');
    }
    
    btn.addEventListener('click', () => {
        document.querySelectorAll('.font-size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateFontSize(size);
    });
});

// Recent tools list
function updateRecentToolsList() {
    const recentList = document.querySelector('.recent-tools-list');
    recentList.innerHTML = '';
    
    userPreferences.lastUsedTools.forEach(toolName => {
        const tool = tools[toolName];
        if (tool) {
            const badge = document.createElement('div');
            badge.className = 'recent-tool-badge';
            badge.textContent = tool.title;
            badge.addEventListener('click', () => {
                const toolCard = document.querySelector(`[data-tool="${toolName}"]`);
                toolCard.click();
            });
            recentList.appendChild(badge);
        }
    });

    // Hide recent tools section if empty
    const recentTools = document.querySelector('.recent-tools');
    recentTools.style.display = userPreferences.lastUsedTools.length ? 'block' : 'none';
}

// Initialize recent tools
updateRecentToolsList();

// Enhanced keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Don't trigger shortcuts if user is typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }

    switch(e.key) {
        case '/':
            e.preventDefault();
            searchInput.focus();
            break;
        case '?':
            e.preventDefault();
            openShortcutsModal();
            break;
        case 'Escape':
            closeModal();
            closeShortcutsModal();
            searchInput.blur();
            break;
        case 't':
        case 'T':
            e.preventDefault();
            document.querySelector('.theme-toggle').click();
            break;
        case 'f':
        case 'F':
            // Toggle favorite for the currently focused tool
            const focusedTool = document.querySelector('.tool-card:hover');
            if (focusedTool) {
                focusedTool.querySelector('.favorite-btn').click();
            }
            break;
        default:
            // Number keys 1-9 for quick access to tools
            if (!isNaN(e.key) && e.key !== '0') {
                const index = parseInt(e.key) - 1;
                const toolCard = document.querySelectorAll('.tool-card')[index];
                if (toolCard) {
                    toolCard.click();
                }
            }
            break;
    }
});

// Search functionality
const searchInput = document.getElementById('search-tools');
const toolCards = document.querySelectorAll('.tool-card');

function filterTools(query) {
    const searchTerm = query.toLowerCase();
    toolCards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const description = card.querySelector('p').textContent.toLowerCase();
        const isVisible = title.includes(searchTerm) || description.includes(searchTerm);
        card.classList.toggle('hidden', !isVisible);
    });
}

searchInput.addEventListener('input', (e) => filterTools(e.target.value));

// Keyboard shortcuts
const shortcutsBtn = document.querySelector('.shortcuts-btn');
const shortcutsModal = document.getElementById('shortcuts-modal');
const shortcutsClose = shortcutsModal.querySelector('.close');

function openShortcutsModal() {
    shortcutsModal.style.display = 'block';
}

function closeShortcutsModal() {
    shortcutsModal.style.display = 'none';
}

shortcutsBtn.addEventListener('click', openShortcutsModal);
shortcutsClose.addEventListener('click', closeShortcutsModal);

// Global keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Don't trigger shortcuts if user is typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }

    switch(e.key) {
        case '/':
            e.preventDefault();
            searchInput.focus();
            break;
        case '?':
            e.preventDefault();
            openShortcutsModal();
            break;
        case 'Escape':
            closeModal();
            closeShortcutsModal();
            break;
        case 't':
        case 'T':
            e.preventDefault();
            document.querySelector('.theme-toggle').click();
            break;
        default:
            // Number keys 1-9 for quick access to tools
            if (!isNaN(e.key) && e.key !== '0') {
                const index = parseInt(e.key) - 1;
                const toolCard = toolCards[index];
                if (toolCard) {
                    toolCard.click();
                }
            }
            break;
    }
});

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
    if (e.target === shortcutsModal) {
        closeShortcutsModal();
    }
});
