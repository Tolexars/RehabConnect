// Smart Noter functionality
document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const inputMethods = document.getElementById('input-methods');
    const recordAudioBtn = document.getElementById('record-audio');
    const recordVideoBtn = document.getElementById('record-video');
    const uploadFileBtn = document.getElementById('upload-file');
    const textInputBtn = document.getElementById('text-input');
    const youtubeUrlBtn = document.getElementById('youtube-url');
    const fileUploadInput = document.getElementById('file-upload');
    const recordingSection = document.getElementById('recording-section');
    const youtubeInput = document.getElementById('youtube-input');
    const textInputArea = document.getElementById('text-input-area');
    const processingSection = document.getElementById('processing-section');
    const resultsSection = document.getElementById('results-section');
    const startRecordingBtn = document.getElementById('start-recording');
    const stopRecordingBtn = document.getElementById('stop-recording');
    const recordingTimer = document.getElementById('recording-timer');
    const youtubeUrlInput = document.getElementById('youtube-url-input');
    const processYoutubeBtn = document.getElementById('process-youtube');
    const textInputField = document.getElementById('text-input-field');
    const processTextBtn = document.getElementById('process-text');
    const transcriptionResults = document.getElementById('transcription-results');
    const copyResultsBtn = document.getElementById('copy-results');
    const downloadResultsBtn = document.getElementById('download-results');
    const saveResultsBtn = document.getElementById('save-results');
    const historyList = document.getElementById('history-list');
    const visualizerCanvas = document.getElementById('visualizer');
    
    // State variables
    let mediaRecorder = null;
    let audioChunks = [];
    let recordingInterval = null;
    let recordingSeconds = 0;
    let audioContext = null;
    let analyser = null;
    let visualizationInterval = null;
    let currentRecordingType = null;
    let githubToken = null;
    let userId = null;
    
    // GitHub Configuration
    const GITHUB_API_URL = "https://models.github.ai/inference/chat/completions";
    const AI_MODEL = "openai/gpt-4.1";
    
    // Initialize the application
    function init() {
        setupEventListeners();
        fetchGitHubToken();
        checkAuthStatus();
        loadNoteHistory();
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Input method selection
        recordAudioBtn.addEventListener('click', () => showRecordingSection('audio'));
        recordVideoBtn.addEventListener('click', () => showRecordingSection('video'));
        uploadFileBtn.addEventListener('click', () => fileUploadInput.click());
        textInputBtn.addEventListener('click', () => showTextInput());
        youtubeUrlBtn.addEventListener('click', () => showYoutubeInput());
        
        // File upload handling
        fileUploadInput.addEventListener('change', handleFileUpload);
        
        // Recording controls
        startRecordingBtn.addEventListener('click', startRecording);
        stopRecordingBtn.addEventListener('click', stopRecording);
        
        // Processing buttons
        processYoutubeBtn.addEventListener('click', processYouTubeUrl);
        processTextBtn.addEventListener('click', processTextInput);
        
        // Results actions
        copyResultsBtn.addEventListener('click', copyResults);
        downloadResultsBtn.addEventListener('click', downloadResults);
        saveResultsBtn.addEventListener('click', saveResults);
    }
    
    // Show recording section based on type
    function showRecordingSection(type) {
        currentRecordingType = type;
        hideAllSections();
        inputMethods.style.display = 'none';
        recordingSection.style.display = 'block';
        
        if (type === 'audio') {
            startRecordingBtn.innerHTML = '<i class="fas fa-microphone"></i> Start Audio Recording';
        } else {
            startRecordingBtn.innerHTML = '<i class="fas fa-video"></i> Start Video Recording';
        }
    }
    
    // Show YouTube input section
    function showYoutubeInput() {
        hideAllSections();
        inputMethods.style.display = 'none';
        youtubeInput.style.display = 'block';
    }
    
    // Show text input section
    function showTextInput() {
        hideAllSections();
        inputMethods.style.display = 'none';
        textInputArea.style.display = 'block';
    }
    
    // Hide all input sections
    function hideAllSections() {
        recordingSection.style.display = 'none';
        youtubeInput.style.display = 'none';
        textInputArea.style.display = 'none';
        processingSection.style.display = 'none';
        resultsSection.style.display = 'none';
    }
    
    // Handle file upload
    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Check if file is audio or video
        if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
            showProcessing();
            processAudioVideoFile(file);
        } else {
            alert('Please upload an audio or video file');
        }
    }
    
    // Start recording
    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: currentRecordingType === 'video'
            });
            
            // Setup audio visualization
            setupAudioVisualization(stream);
            
            // Initialize media recorder
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            
            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };
            
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                showProcessing();
                processAudioRecording(audioBlob);
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
                
                // Clean up audio context
                if (audioContext) {
                    audioContext.close();
                    audioContext = null;
                }
                
                // Stop visualization
                if (visualizationInterval) {
                    clearInterval(visualizationInterval);
                    visualizationInterval = null;
                }
            };
            
            // Start recording
            mediaRecorder.start();
            startRecordingTimer();
            
            // Update UI
            startRecordingBtn.disabled = true;
            stopRecordingBtn.disabled = false;
            
        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Could not access your microphone/camera. Please check permissions.');
        }
    }
    
    // Stop recording
    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            stopRecordingTimer();
            
            // Update UI
            startRecordingBtn.disabled = false;
            stopRecordingBtn.disabled = true;
        }
    }
    
    // Start recording timer
    function startRecordingTimer() {
        recordingSeconds = 0;
        updateTimerDisplay();
        
        recordingInterval = setInterval(() => {
            recordingSeconds++;
            updateTimerDisplay();
        }, 1000);
    }
    
    // Stop recording timer
    function stopRecordingTimer() {
        if (recordingInterval) {
            clearInterval(recordingInterval);
            recordingInterval = null;
        }
    }
    
    // Update timer display
    function updateTimerDisplay() {
        const hours = Math.floor(recordingSeconds / 3600);
        const minutes = Math.floor((recordingSeconds % 3600) / 60);
        const seconds = recordingSeconds % 60;
        
        recordingTimer.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Setup audio visualization
    function setupAudioVisualization(stream) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const canvasCtx = visualizerCanvas.getContext('2d');
        const width = visualizerCanvas.width;
        const height = visualizerCanvas.height;
        
        function draw() {
            visualizationInterval = requestAnimationFrame(draw);
            
            analyser.getByteFrequencyData(dataArray);
            
            canvasCtx.fillStyle = '#f8f9fa';
            canvasCtx.fillRect(0, 0, width, height);
            
            const barWidth = (width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;
            
            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2;
                
                canvasCtx.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
                canvasCtx.fillRect(x, height - barHeight, barWidth, barHeight);
                
                x += barWidth + 1;
            }
        }
        
        draw();
    }
    
    // Process audio/video file with actual speech-to-text
    function processAudioVideoFile(file) {
        showProcessing();
        
        // Check if it's a video file and extract audio
        if (file.type.startsWith('video/')) {
            extractAudioFromVideo(file)
                .then(audioBlob => {
                    transcribeAudio(audioBlob);
                })
                .catch(error => {
                    console.error('Error extracting audio:', error);
                    showResults("Error processing video file: " + error.message);
                });
        } else {
            // It's already an audio file
            transcribeAudio(file);
        }
    }
    
    // Extract audio from video file
    function extractAudioFromVideo(videoFile) {
        return new Promise((resolve, reject) => {
            // Create a video element to extract audio
            const video = document.createElement('video');
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            let mediaStreamSource = null;
            let destination = null;
            let mediaRecorder = null;
            const audioChunks = [];
            
            video.src = URL.createObjectURL(videoFile);
            video.muted = true;
            video.play().then(() => {
                const stream = video.captureStream();
                mediaStreamSource = audioContext.createMediaStreamSource(stream);
                destination = audioContext.createMediaStreamDestination();
                mediaStreamSource.connect(destination);
                
                mediaRecorder = new MediaRecorder(destination.stream);
                
                mediaRecorder.ondataavailable = (event) => {
                    audioChunks.push(event.data);
                };
                
                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    resolve(audioBlob);
                    URL.revokeObjectURL(video.src);
                };
                
                mediaRecorder.start();
                
                // Stop when video ends
                video.onended = () => {
                    mediaRecorder.stop();
                };
            }).catch(reject);
        });
    }
    
    // Transcribe audio using Web Speech API (or your preferred service)
    function transcribeAudio(audioBlob) {
        // Note: This is a simplified example. In a real application, you would:
        // 1. Use a proper speech-to-text API (like Google Cloud Speech-to-Text, Azure Speech, etc.)
        // 2. Send the audio data to the API
        // 3. Process the response
        
        // For demonstration, we'll use the Web Speech API (browser-based)
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            recognition.continuous = true;
            recognition.interimResults = false;
            
            // Create a URL for the audio blob
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            
            recognition.onresult = (event) => {
                let transcript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                }
                showResults(transcript);
            };
            
            recognition.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                showResults("Speech recognition failed: " + event.error);
            };
            
            recognition.onend = () => {
                URL.revokeObjectURL(audioUrl);
            };
            
            // Start recognition when audio plays
            audio.onplay = () => {
                recognition.start();
            };
            
            audio.play();
        } else {
            // Fallback to simulated processing if speech recognition isn't available
            simulateProcessing(() => {
                showResults("This is a simulated transcription. In a real implementation, this would use a speech-to-text service. Your browser doesn't support the Web Speech API.");
            });
        }
    }
    
    // Process audio recording with actual speech-to-text
    function processAudioRecording(audioBlob) {
        showProcessing();
        transcribeAudio(audioBlob);
    }
    
    // Process YouTube URL
    function processYouTubeUrl() {
        const url = youtubeUrlInput.value.trim();
        if (!url) {
            alert('Please enter a YouTube URL');
            return;
        }
        
        // Simple URL validation
        if (!url.includes('youtube.com/') && !url.includes('youtu.be/')) {
            alert('Please enter a valid YouTube URL');
            return;
        }
        
        showProcessing();
        // In a real implementation, you would extract audio from YouTube
        // For this example, we'll simulate processing
        simulateProcessing(() => {
            showResults("This is a simulated transcription from a YouTube video. In a real implementation, this would extract audio from the YouTube URL and transcribe it using the GitHub AI API.");
        });
    }
    
    // Process text input
    function processTextInput() {
        const text = textInputField.value.trim();
        if (!text) {
            alert('Please enter some text');
            return;
        }
        
        showProcessing();
        // For text input, we can use the AI to summarize or enhance it
        processWithAI(text, "Please process and enhance this text:");
    }
    
    // Show processing state
    function showProcessing() {
        hideAllSections();
        processingSection.style.display = 'block';
    }
    
    // Show results
    function showResults(text) {
        hideAllSections();
        inputMethods.style.display = 'grid';
        resultsSection.style.display = 'block';
        transcriptionResults.textContent = text;
    }
    
    // Simulate processing (for demo purposes)
    function simulateProcessing(callback) {
        setTimeout(callback, 2000);
    }
    
    // Process with AI using GitHub API
    async function processWithAI(input, systemPrompt) {
        try {
            if (!githubToken) {
                await fetchGitHubToken();
            }
            
            const response = await fetch(GITHUB_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${githubToken}`
                },
                body: JSON.stringify({
                    model: AI_MODEL,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: input }
                    ],
                    temperature: 0.7,
                    max_tokens: 1000
                })
            });
            
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            
            const data = await response.json();
            const aiResponse = data.choices[0].message.content.trim();
            
            showResults(aiResponse);
            
        } catch (error) {
            console.error('Error processing with AI:', error);
            showResults("Sorry, there was an error processing your request. Please try again later.");
        }
    }
    
    // Copy results to clipboard
    function copyResults() {
        const text = transcriptionResults.textContent;
        navigator.clipboard.writeText(text).then(() => {
            alert('Copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy:', err);
            alert('Failed to copy to clipboard');
        });
    }
    
    // Download results as text file
    function downloadResults() {
        const text = transcriptionResults.textContent;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'smart-noter-transcription.txt';
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }
    
    // Save results to user's history
    function saveResults() {
        const user = firebase.auth().currentUser;
        if (!user) {
            alert('Please log in to save notes');
            return;
        }
        
        const text = transcriptionResults.textContent;
        const timestamp = new Date().toISOString();
        const title = text.substring(0, 30) + (text.length > 30 ? '...' : '');
        
        const noteData = {
            title: title,
            content: text,
            timestamp: timestamp,
            type: currentRecordingType || 'text'
        };
        
        // Save to Firebase
        const notesRef = firebase.database().ref(`users/${user.uid}/notes`);
        notesRef.push(noteData)
            .then(() => {
                alert('Note saved successfully!');
                loadNoteHistory();
            })
            .catch(error => {
                console.error('Error saving note:', error);
                alert('Failed to save note');
            });
    }
    
    // Load note history from Firebase
    function loadNoteHistory() {
        const user = firebase.auth().currentUser;
        if (!user) {
            historyList.innerHTML = '<p class="no-history">Log in to view your note history</p>';
            return;
        }
        
        firebase.database().ref(`users/${user.uid}/notes`).once('value')
            .then(snapshot => {
                const notes = [];
                snapshot.forEach(childSnapshot => {
                    const note = childSnapshot.val();
                    note.id = childSnapshot.key;
                    notes.push(note);
                });
                
                if (notes.length === 0) {
                    historyList.innerHTML = '<p class="no-history">No notes yet. Create your first note!</p>';
                    return;
                }
                
                // Sort by timestamp descending
                notes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                
                // Clear history list
                historyList.innerHTML = '';
                
                // Add notes to history
                notes.forEach(note => {
                    const noteElement = document.createElement('div');
                    noteElement.classList.add('history-item');
                    
                    const date = new Date(note.timestamp);
                    const dateString = date.toLocaleDateString();
                    const timeString = date.toLocaleTimeString();
                    
                    noteElement.innerHTML = `
                        <div class="history-item-header">
                            <span class="history-item-title">${note.title}</span>
                            <span class="history-item-date">${dateString} ${timeString}</span>
                        </div>
                        <div class="history-item-preview">${note.content.substring(0, 100)}${note.content.length > 100 ? '...' : ''}</div>
                    `;
                    
                    noteElement.addEventListener('click', () => {
                        showResults(note.content);
                    });
                    
                    historyList.appendChild(noteElement);
                });
            })
            .catch(error => {
                console.error('Error loading note history:', error);
                historyList.innerHTML = '<p class="no-history">Error loading note history</p>';
            });
    }
    
    // Fetch GitHub token from Firebase
    async function fetchGitHubToken() {
        try {
            const snapshot = await firebase.database().ref('token').once('value');
            githubToken = snapshot.val();
            
            if (!githubToken) {
                throw new Error('GitHub token not found in database');
            }
            
        } catch (error) {
            console.error('Error fetching token:', error);
            alert('Failed to connect to AI service. Please try again later.');
        }
    }
    
    // Check authentication status
    function checkAuthStatus() {
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                userId = user.uid;
                loadNoteHistory();
                
                // Show profile image if logged in
                const profileImageNav = document.querySelector('.profile-image-nav');
                if (profileImageNav) {
                    profileImageNav.style.display = 'block';
                    // Set profile image if available
                    if (user.photoURL) {
                        document.querySelector('.nav-profile-img').src = user.photoURL;
                    }
                }
                
                // Update login button
                const loginBtn = document.getElementById('login-btn');
                if (loginBtn) {
                    loginBtn.textContent = 'Logout';
                    loginBtn.removeEventListener('click', showLoginModal);
                    loginBtn.addEventListener('click', () => firebase.auth().signOut());
                }
            } else {
                userId = null;
                
                // Hide profile image if logged out
                const profileImageNav = document.querySelector('.profile-image-nav');
                if (profileImageNav) {
                    profileImageNav.style.display = 'none';
                }
                
                // Update login button
                const loginBtn = document.getElementById('login-btn');
                if (loginBtn) {
                    loginBtn.textContent = 'Login';
                    loginBtn.removeEventListener('click', () => firebase.auth().signOut());
                    loginBtn.addEventListener('click', showLoginModal);
                }
                
                loadNoteHistory();
            }
        });
    }
    
    // Show login modal
    function showLoginModal() {
        const authModal = document.getElementById('auth-modal');
        if (authModal) {
            authModal.style.display = 'block';
        }
    }
    
    // Initialize the app
    init();
});