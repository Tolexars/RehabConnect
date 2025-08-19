// ai-therapist.js - Enhanced AI Therapist with Complete Conversation Saving
document.addEventListener('DOMContentLoaded', function() {
    // Therapist data with enhanced therapy-oriented prompts
    const therapistData = {
        psychologist: {
            title: "AI Psychologist",
            icon: "fas fa-brain",
            prompt: `You are Dr. Alalade, an experienced clinical psychologist. Start by introducing yourself and asking about the patient's main concerns. Use a warm, empathetic tone.
            Key areas to cover:
             - Personal background: 
               - Duration of concerns: 
                - Symptoms experienced: 
                - Impact on daily life:
            
             Ask follow-up questions about:
            - Their personal background
            - Duration of their concerns
            - Symptoms they're experiencing
            - How it's affecting their daily life
            Provide professional insights but in simple, human terms. Never diagnose, but suggest when to seek professional help.`
        },
        physiotherapist: {
            title: "AI Physiotherapist",
            icon: "fas fa-running",
            prompt: `You are Michael, a licensed physiotherapist with 15 years experience. Start by asking:
           - biodata or personal data 
            - Where the physical limitations experienced
            - How long they've had it
            - What activities make it better/worse
            - Any previous injuries or accident
            Suggest gentle exercises and explain them simply. Keep language simple and encouraging. Always remind them to consult a professional for actual treatment.`
        },
        occupational: {
            title: "AI Occupational Therapist",
            icon: "fas fa-hands-helping",
            prompt: `You are Deoye, an occupational therapy specialist. Begin by asking:
            - biodata or personal data
            - What occupational performance are challenging
            - Daily activities
            - Their home/work environment
            - impact on socialisation
            - work and productivity
            - play and liesure
            - routines
            - What they'd like to improve
            - Any specific goals
            Focus on practical solutions, therapeutic activities and adaptive strategies. Keep language simple and encouraging.`
        },
        speech: {
            title: "AI Speech Therapist",
            icon: "fas fa-comment-medical",
            prompt: `You are David, a speech-language pathologist. Start by asking:
            - What communication challenges they face
            - How long they've experienced them
            - Situations where it's most difficult
            - Any related medical history
            Provide simple exercises and reassurance. Emphasize that progress takes time.`
        },
        nurse: {
            title: "AI Nurse Consultant",
            icon: "fas fa-user-nurse",
            prompt: `You are Nurse Samantha with 20 years experience. Begin by asking:
            - biodata or personal data (name,age, sex/gender etc.)
            - Their main health concern
            - Current symptoms
            - Medications they're taking
            - Any pre-existing conditions
            Provide clear explanations and suggest when to see a doctor. Use simple, non-medical language.`
        },
        rehab: {
            title: "AI Rehabilitation Specialist",
            icon: "fas fa-heartbeat",
            prompt: `You are Dr. Roberts, a rehabilitation specialist. Start by asking:
            - Their injury/condition
            - How it occurred
            - Current limitations
            - Rehabilitation goals
            Suggest holistic approaches and celebrate small victories. Explain concepts simply.`
        }
    };

    // DOM elements
    const therapistSelection = document.getElementById('therapistSelection');
    const chatContainer = document.getElementById('chatContainer');
    const chatMessages = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const typingIndicator = document.getElementById('typingIndicator');
    const selectedTherapistTitle = document.getElementById('selectedTherapistTitle');
    const changeTherapistBtn = document.getElementById('changeTherapistBtn');
    const newConversationBtn = document.getElementById('newConversationBtn');
    const historyList = document.getElementById('historyList');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const aiSidebar = document.getElementById('aiSidebar');
    const statusIndicator = document.getElementById('statusIndicator');
    
    // GitHub Configuration
    const GITHUB_API_URL = "https://models.github.ai/inference/chat/completions";
    const AI_MODEL = "openai/gpt-4.1";
    
    // State variables
    let selectedTherapist = null;
    let conversation = [];
    let githubToken = null;
    let userId = null;
    let currentConversationId = null;
    
   

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const database = firebase.database();
    const auth = firebase.auth();
    
    // Initialize the application
    function init() {
        setupEventListeners();
        fetchGitHubToken();
        checkAuthStatus();
    }
    
    // Fetch GitHub token from Firebase
    async function fetchGitHubToken() {
        try {
            statusIndicator.className = "status-indicator loading";
            statusIndicator.innerHTML = '<i class="fas fa-sync fa-spin"></i> <span>Fetching GitHub token...</span>';
            
            // NOTE: This token fetching method is for demonstration only. 
            // In a production app, this should be handled server-side for security.
            const snapshot = await database.ref('token').once('value');
            githubToken = snapshot.val();
            
            if (!githubToken) {
                throw new Error('GitHub token not found in database');
            }
            
            statusIndicator.className = "status-indicator connected";
            statusIndicator.innerHTML = '<i class="fas fa-check-circle"></i> <span>Connected to AI service</span>';
            setTimeout(() => statusIndicator.style.display = 'none', 2000);
        } catch (error) {
            console.error('Error fetching token:', error);
            statusIndicator.className = "status-indicator error";
            statusIndicator.innerHTML = `<i class="fas fa-exclamation-circle"></i> <span>Error: ${error.message}</span>`;
        }
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Therapist selection
        document.querySelectorAll('.therapist-card').forEach(card => {
            card.addEventListener('click', () => {
                const user = auth.currentUser;
                if (!user) {
                    // Placeholder for a login/auth modal
                    showError("You must be logged in to start a conversation.");
                    return;
                }
                
                selectedTherapist = card.dataset.type;
                startNewSession();
            });
        });
        
        // Change therapist button
        changeTherapistBtn.addEventListener('click', () => {
            chatContainer.style.display = 'none';
            therapistSelection.style.display = 'flex';
        });
        
        // New conversation button
        newConversationBtn.addEventListener('click', () => {
            if (selectedTherapist) {
                startNewSession();
            } else {
                therapistSelection.style.display = 'flex';
                chatContainer.style.display = 'none';
            }
        });
        
        // Send message
        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        // Input auto-resize
        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });

        // Sidebar toggle for mobile
        sidebarToggle.addEventListener('click', () => {
            aiSidebar.classList.toggle('active');
        });
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth < 992 && aiSidebar.classList.contains('active') && 
                !aiSidebar.contains(e.target) && e.target !== sidebarToggle) {
                aiSidebar.classList.remove('active');
            }
        });
    }
    
    // Check authentication status
    function checkAuthStatus() {
        auth.onAuthStateChanged(user => {
            if (user) {
                userId = user.uid;
                loadConversationHistory();
            } else {
                userId = null;
                historyList.innerHTML = '<p class="no-history">Log in to view history</p>';
            }
        });
    }
    
    // Start a new therapy session
    function startNewSession() {
        const therapist = therapistData[selectedTherapist];
        currentConversationId = null;
        
        // Update UI
        selectedTherapistTitle.textContent = therapist.title;
        document.querySelectorAll('.therapist-card').forEach(card => {
            card.classList.remove('selected');
            if (card.dataset.type === selectedTherapist) {
                card.classList.add('selected');
            }
        });
        
        // Hide selection, show chat
        therapistSelection.style.display = 'none';
        chatContainer.style.display = 'flex';
        
        // Start new conversation
        conversation = [{
            role: "system",
            content: therapist.prompt
        }];
        
        // Clear chat
        chatMessages.innerHTML = '';
        
        // Add initial greeting message
        addMessageToChat('ai', "Hello! I'm your AI therapist. How can I assist you today?");
        saveConversation();
    }
    
    // Add message to chat UI
    // ... existing code ...

// Add message to chat UI with enhanced formatting
function addMessageToChat(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(sender === 'user' ? 'user-message' : 'ai-message');
    
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Format message content with enhanced styling
    const formattedContent = sender === 'ai' ? 
        formatAIMessage(text) : 
        formatUserMessage(text);
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <span>${sender === 'user' ? 'You' : 'AI Therapist'}</span>
            <span>${timeString}</span>
        </div>
        <div class="message-content">${formattedContent}</div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Format AI messages with bold headings and linkified URLs
function formatAIMessage(text) {
    // Convert URLs to clickable links
    const withLinks = text.replace(
        /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig,
        '<a href="$1" target="_blank" class="message-link">$1</a>'
    );
    
    // Format headings with bold text
    const formattedText = withLinks
        .split('\n')
        .map(line => {
            // Format lines ending with colon as headings
            if (line.trim().endsWith(':') && line.length < 100) {
                return `<strong class="message-heading">${line}</strong>`;
            }
            return line;
        })
        .join('<br>');
    
    return formattedText;
}

// Format user messages (just linkify URLs)
function formatUserMessage(text) {
    return text.replace(
        /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig,
        '<a href="$1" target="_blank" class="message-link">$1</a>'
    );
}

// ... existing code ...
    
    // Generate therapist response
    async function generateTherapistResponse() {
        // Show typing indicator
        typingIndicator.style.display = 'block';
        chatMessages.scrollTop = chatMessages.scrollHeight;
        sendButton.disabled = true;
        
        try {
            const response = await fetch(GITHUB_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${githubToken}`
                },
                body: JSON.stringify({
                    model: AI_MODEL,
                    messages: conversation,
                    temperature: 0.7,
                    max_tokens: 250
                })
            });
            
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            
            const data = await response.json();
            const aiResponse = data.choices[0].message.content.trim();

            typingIndicator.style.display = 'none';
            
            // Add to conversation and chat
            conversation.push({
                role: "assistant",
                content: aiResponse
            });
            addMessageToChat('ai', aiResponse);
            
            // Save conversation
            saveConversation();
            
        } catch (error) {
            console.error('Error generating response:', error);
            typingIndicator.style.display = 'none';
            addMessageToChat('ai', "I'm having trouble responding right now. Please try again later.");
        } finally {
            sendButton.disabled = false;
        }
    }
    
    // Send user message
    function sendMessage() {
        const message = messageInput.value.trim();
        if (!message) return;
        
        // Add user message to chat and conversation
        addMessageToChat('user', message);
        conversation.push({
            role: "user",
            content: message
        });
        
        // Clear input
        messageInput.value = '';
        messageInput.style.height = 'auto';
        messageInput.focus();
        
        // Generate therapist response
        generateTherapistResponse();
    }
    
    // Save entire conversation to Firebase
    function saveConversation() {
        if (!selectedTherapist || !userId) return;
        
        const therapist = therapistData[selectedTherapist];
        const timestamp = new Date().toISOString();
        
        const conversationData = {
            therapistType: selectedTherapist,
            therapistTitle: therapist.title,
            timestamp: timestamp,
            messages: JSON.stringify(conversation) // Save entire conversation as JSON string
        };
        
        if (!currentConversationId) {
            // New conversation
            const newConversationRef = database.ref(`users/${userId}/conversations`).push();
            currentConversationId = newConversationRef.key;
            newConversationRef.set(conversationData)
                .then(() => loadConversationHistory())
                .catch(error => console.error('Error saving new conversation:', error));
        } else {
            // Update existing conversation
            database.ref(`users/${userId}/conversations/${currentConversationId}`).update(conversationData)
                .catch(error => console.error('Error updating conversation:', error));
        }
    }
    
    // Load conversation history
    function loadConversationHistory() {
        if (!userId) {
            historyList.innerHTML = '<p class="no-history">Log in to view history</p>';
            return;
        }
        
        historyList.innerHTML = '';
        
        database.ref(`users/${userId}/conversations`).once('value')
            .then(snapshot => {
                const conversations = [];
                snapshot.forEach(childSnapshot => {
                    const convo = childSnapshot.val();
                    convo.id = childSnapshot.key;
                    conversations.push(convo);
                });
                
                if (conversations.length === 0) {
                    historyList.innerHTML = '<p class="no-history">No previous conversations found</p>';
                    return;
                }
                
                // Sort by timestamp descending
                conversations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                
                conversations.forEach(item => {
                    const therapist = therapistData[item.therapistType] || { title: "AI Therapist" };
                    const date = new Date(item.timestamp);
                    const dateString = date.toLocaleDateString();
                    
                    let previewText = "View conversation";
                    try {
                        const messages = JSON.parse(item.messages);
                        const userMessage = messages.find(msg => msg.role === "user");
                        if (userMessage && userMessage.content) {
                            previewText = userMessage.content.substring(0, 100) + (userMessage.content.length > 100 ? '...' : '');
                        }
                    } catch (e) {
                        console.error('Error parsing messages:', e);
                    }
                    
                    const historyItem = document.createElement('div');
                    historyItem.classList.add('history-item');
                    historyItem.innerHTML = `
                        <div class="history-header">
                            <span class="therapist-type">${therapist.title}</span>
                            <span class="history-date">${dateString}</span>
                        </div>
                        <div class="history-preview">${previewText}</div>
                    `;
                    
                    historyItem.addEventListener('click', () => {
                        openConversation(item);
                        // Hide sidebar on mobile
                        if (window.innerWidth < 992) {
                            aiSidebar.classList.remove('active');
                        }
                    });
                    
                    historyList.appendChild(historyItem);
                });
            })
            .catch(error => {
                console.error('Error loading conversation history:', error);
                historyList.innerHTML = '<p class="error-msg">Failed to load conversation history</p>';
            });
    }
    
    // Open conversation from history
    function openConversation(item) {
        selectedTherapist = item.therapistType;
        currentConversationId = item.id;
        
        try {
            conversation = JSON.parse(item.messages);
        } catch (e) {
            console.error('Error parsing conversation:', e);
            conversation = [{
                role: "system",
                content: therapistData[selectedTherapist]?.prompt || "You are an AI therapist"
            }];
        }
        
        const therapist = therapistData[selectedTherapist] || { title: "AI Therapist" };
        selectedTherapistTitle.textContent = therapist.title;
        
        
        therapistSelection.style.display = 'none';
        chatContainer.style.display = 'flex';
        
        renderFullConversation();
    }
    
    // Render entire conversation to chat
    function renderFullConversation() {
        chatMessages.innerHTML = '';
        
        // Render all messages from index 1 (skipping the initial system prompt)
        for (let i = 1; i < conversation.length; i++) {
            const msg = conversation[i];
            addMessageToChat(msg.role === 'user' ? 'user' : 'ai', msg.content);
        }
    }
    
    // Show error notification
    function showError(message) {
        const errorEl = document.createElement('div');
        errorEl.className = 'error-notification';
        errorEl.innerHTML = `<i class="fas fa-exclamation-circle"></i><span>${message}</span><i class="fas fa-times close-btn"></i>`;
        
        document.body.appendChild(errorEl);
        
        errorEl.querySelector('.close-btn').addEventListener('click', () => errorEl.remove());
        setTimeout(() => { if (document.body.contains(errorEl)) errorEl.remove(); }, 5000);
    }
    
    // Initialize the app
    init();
});
