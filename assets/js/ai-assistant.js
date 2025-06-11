document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const methodTabs = document.querySelectorAll('.method-tab');
    const methodContents = document.querySelectorAll('.method-content');
    const questionMethod = document.getElementById('question-method');
    const uploadMethod = document.getElementById('upload-method');
    const aiQuestion = document.getElementById('ai-question');
    const askQuestionBtn = document.getElementById('ask-question-btn');
    const uploadDropzone = document.getElementById('upload-dropzone');
    const fileUpload = document.getElementById('file-upload');
    const filePreview = document.getElementById('file-preview');
    const analyzeBtn = document.getElementById('analyze-btn');
    const analysisType = document.getElementById('analysis-type');
    const customPrompt = document.getElementById('custom-prompt');
    const aiOutput = document.getElementById('ai-output');
    const loadingIndicator = document.getElementById('loading-indicator');
    const copyBtn = document.getElementById('copy-btn');
    const downloadDocxBtn = document.getElementById('download-docx');
    const downloadPdfBtn = document.getElementById('download-pdf');

    // Current state
    let uploadedFiles = [];
    let currentAnalysisType = 'summary';
    let aiResponse = '';
    let extractedText = '';

    // Initialize method tabs
    methodTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const method = tab.dataset.method;

            // Update active tab
            methodTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Show corresponding content
            methodContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${method}-method`).classList.add('active');
        });
    });

    // Handle analysis type change
    analysisType.addEventListener('change', (e) => {
        currentAnalysisType = e.target.value;
        if (currentAnalysisType === 'custom') {
            customPrompt.style.display = 'block';
        } else {
            customPrompt.style.display = 'none';
        }
    });

    // Handle file upload
    fileUpload.addEventListener('change', handleFileUpload);

    // Drag and drop functionality
    uploadDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadDropzone.classList.add('dragover');
    });

    uploadDropzone.addEventListener('dragleave', () => {
        uploadDropzone.classList.remove('dragover');
    });

    uploadDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadDropzone.classList.remove('dragover');
        fileUpload.files = e.dataTransfer.files;
        handleFileUpload({ target: fileUpload });
    });

    // Ask question button
    askQuestionBtn.addEventListener('click', handleQuestionSubmit);
    aiQuestion.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleQuestionSubmit();
        }
    });

    // Analyze button
    analyzeBtn.addEventListener('click', handleDocumentAnalysis);

    // Output actions
    copyBtn.addEventListener('click', copyToClipboard);
    downloadDocxBtn.addEventListener('click', downloadAsDocx);
    downloadPdfBtn.addEventListener('click', downloadAsPdf);

    // Functions
    function handleFileUpload(e) {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        uploadedFiles = files;
        analyzeBtn.disabled = false;

        // Clear previous preview
        filePreview.innerHTML = '';

        // Create preview items
        files.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-preview-item';

            const fileName = document.createElement('span');
            fileName.textContent = file.name;

            const removeIcon = document.createElement('i');
            removeIcon.className = 'bx bx-x';
            removeIcon.addEventListener('click', () => removeFile(file));

            fileItem.appendChild(fileName);
            fileItem.appendChild(removeIcon);
            filePreview.appendChild(fileItem);
        });
    }

    function removeFile(fileToRemove) {
        uploadedFiles = uploadedFiles.filter(file => file !== fileToRemove);

        // Update file input (this requires creating a new DataTransfer object)
        const dataTransfer = new DataTransfer();
        uploadedFiles.forEach(file => dataTransfer.items.add(file));
        fileUpload.files = dataTransfer.files;

        // Update preview
        filePreview.innerHTML = '';
        if (uploadedFiles.length > 0) {
            uploadedFiles.forEach(file => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-preview-item';

                const fileName = document.createElement('span');
                fileName.textContent = file.name;

                const removeIcon = document.createElement('i');
                removeIcon.className = 'bx bx-x';
                removeIcon.addEventListener('click', () => removeFile(file));

                fileItem.appendChild(fileName);
                fileItem.appendChild(removeIcon);
                filePreview.appendChild(fileItem);
            });
        } else {
            analyzeBtn.disabled = true;
        }
    }

    async function handleQuestionSubmit() {
        const question = aiQuestion.value.trim();
        if (!question) {
            showError('Please enter a question');
            return;
        }

        showLoading();

        try {
            // In a real implementation, you would call your AI API here
            // This is a mock implementation
            const response = await mockAIQuestionResponse(question);
            aiResponse = response;
            displayAIResponse(response);
        } catch (error) {
            showError('Failed to get answer: ' + error.message);
        } finally {
            hideLoading();
        }
    }

    async function handleDocumentAnalysis() {
        if (uploadedFiles.length === 0) {
            showError('Please upload at least one file');
            return;
        }

        showLoading();

        try {
            // Extract text from all files
            extractedText = '';
            for (const file of uploadedFiles) {
                const text = await extractTextFromFile(file);
                extractedText += `\n\n=== Document: ${file.name} ===\n\n${text}`;
            }

            // Process with AI based on analysis type
            let prompt = '';
            switch (currentAnalysisType) {
                case 'summary':
                    prompt = 'Please summarize this document, highlighting key findings and recommendations:';
                    break;
                case 'assessment':
                    prompt = 'Create a professional assessment report based on this document, including: 1) Key findings, 2) Analysis, 3) Recommendations:';
                    break;
                case 'treatment':
                    prompt = 'Generate a comprehensive treatment plan based on this document, including: 1) Problem identification, 2) Proposed interventions, 3) Expected outcomes:';
                    break;
                case 'custom':
                    prompt = customPrompt.value.trim() || 'Analyze this document and provide insights:';
                    break;
            }

            // In a real implementation, you would call your AI API here
            // This is a mock implementation
            const response = await mockAIDocumentResponse(prompt, extractedText);
            aiResponse = response;
            displayAIResponse(response);
        } catch (error) {
            showError('Failed to analyze document: ' + error.message);
        } finally {
            hideLoading();
        }
    }

    async function extractTextFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            const fileType = file.name.split('.').pop().toLowerCase();

            reader.onload = async (e) => {
                try {
                    let text = '';

                    if (fileType === 'pdf') {
                        if (typeof pdfjsLib === 'undefined') {
                            throw new Error('pdfjsLib library not loaded. Please include it in your HTML.');
                        }
                        const loadingTask = pdfjsLib.getDocument({ data: e.target.result });
                        const pdf = await loadingTask.promise;
                        for (let i = 1; i <= pdf.numPages; i++) {
                            const page = await pdf.getPage(i);
                            const content = await page.getTextContent();
                            text += content.items.map(item => item.str).join(' ') + '\n';
                        }
                    } else if (fileType === 'docx') {
                        if (typeof mammoth === 'undefined') {
                            throw new Error('mammoth library not loaded. Please include it in your HTML.');
                        }
                        const result = await mammoth.extractRawText({ arrayBuffer: e.target.result });
                        text = result.value;
                    } else if (fileType === 'txt') {
                        text = e.target.result;
                    } else if (fileType === 'xlsx' || fileType === 'xls') {
                        if (typeof XLSX === 'undefined') {
                            throw new Error('SheetJS (XLSX) library not loaded. Please include it in your HTML.');
                        }
                        const data = new Uint8Array(e.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });
                        workbook.SheetNames.forEach(sheetName => {
                            const worksheet = workbook.Sheets[sheetName];
                            text += XLSX.utils.sheet_to_text(worksheet) + '\n\n';
                        });
                    } else if (fileType === 'pptx') {
                        // PPTX extraction is complex and often requires server-side processing or more advanced client-side libraries.
                        text = `[Content from ${file.name} - PPTX extraction not fully implemented in this demo]`;
                    } else {
                        throw new Error(`Unsupported file type: ${fileType}`);
                    }

                    resolve(text);
                } catch (error) {
                    console.error("File extraction error:", error);
                    reject(error);
                }
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            // Read as ArrayBuffer for binary files, as text for plain text files
            const binaryTypes = ['pdf', 'docx', 'xlsx', 'xls', 'pptx'];
            if (binaryTypes.includes(fileType)) {
                reader.readAsArrayBuffer(file);
            } else if (fileType === 'txt') {
                reader.readAsText(file);
            } else {
                 // Fallback for unknown types, try reading as ArrayBuffer.
                 // A more robust solution might alert the user about unsupported types.
                reader.readAsArrayBuffer(file);
            }
        });
    }

    function displayAIResponse(response) {
        aiOutput.innerHTML = `
            <div class="document-content">
                ${formatAIResponse(response)}
            </div>
        `;
    }

    function formatAIResponse(text) {
        let formatted = text;

        // Add section headers
        formatted = formatted.replace(/(\d+\)\s+.+)/g, '<h3>$1</h3>');
        formatted = formatted.replace(/(Key Findings:|Analysis:|Recommendations:|Executive Summary:|Detailed Analysis:)/g, '<h3>$1</h3>');

        // Add paragraph breaks
        formatted = formatted.replace(/\n\n/g, '</p><p>');
        formatted = '<p>' + formatted + '</p>';

        // Convert bullet points (simple heuristic)
        formatted = formatted.replace(/^- (.+)/gm, '<li>$1</li>');
        if (formatted.includes('<li>')) {
            formatted = formatted.replace(/<p><li>/g, '<ul><li>').replace(/<\/li><\/p>/g, '</li></ul>');
        }

        // Highlight important parts
        formatted = formatted.replace(/(important:|note:|warning:)/gi, '<strong>$1</strong>');

        return formatted;
    }

    function showLoading() {
        loadingIndicator.style.display = 'flex';
        aiOutput.style.display = 'none';
        // Clear previous output while loading
        aiOutput.innerHTML = '';
        // Disable buttons to prevent multiple submissions
        askQuestionBtn.disabled = true;
        analyzeBtn.disabled = true;
    }

    function hideLoading() {
        loadingIndicator.style.display = 'none';
        aiOutput.style.display = 'block';
        // Re-enable buttons
        askQuestionBtn.disabled = false;
        analyzeBtn.disabled = (uploadedFiles.length === 0); // Re-enable only if files are present for analysis
    }

    function showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;

        // Remove any existing error
        document.querySelectorAll('.error-message').forEach(el => el.remove());

        // Add to the appropriate section
        if (questionMethod.classList.contains('active')) {
            questionMethod.insertBefore(errorElement, askQuestionBtn);
        } else {
            uploadMethod.insertBefore(errorElement, analyzeBtn);
        }

        setTimeout(() => {
            errorElement.remove();
        }, 5000);
    }

    function copyToClipboard() {
        if (!aiResponse) return;

        navigator.clipboard.writeText(aiResponse)
            .then(() => {
                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
                tooltip.textContent = 'Copied!';
                copyBtn.appendChild(tooltip);

                setTimeout(() => {
                    tooltip.remove();
                }, 2000);
            })
            .catch(err => {
                showError('Failed to copy text: ' + err);
            });
    }

    async function downloadAsDocx() {
        if (!aiResponse) return;

        showLoading();

        try {
            if (typeof docx === 'undefined') {
                throw new Error('docx library not loaded. Please include it in your HTML.');
            }

            const { Document, Paragraph, TextRun, Packer, AlignmentType } = docx;

            const docChildren = [];

            // Add a main title
            docChildren.push(new Paragraph({
                children: [new TextRun({ text: "AI Generated Report", bold: true, size: 48 })], // Approx 24pt
                alignment: AlignmentType.CENTER
            }));

            // Add date
            docChildren.push(new Paragraph({
                children: [new TextRun({ text: `Generated on: ${new Date().toLocaleDateString()}`, size: 24 })], // Approx 12pt
                alignment: AlignmentType.CENTER
            }));

            docChildren.push(new Paragraph({ text: "" })); // Spacer

            // Simple parsing of HTML to DOCX paragraphs.
            // This is a basic conversion; for full HTML support, a more complex parser is needed.
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = formatAIResponse(aiResponse); // Use the formatted HTML output

            Array.from(tempDiv.children).forEach(child => {
                if (child.tagName === 'H3') {
                    docChildren.push(new Paragraph({
                        children: [new TextRun({ text: child.textContent, bold: true, size: 32 })], // Approx 16pt
                        spacing: { before: 200, after: 100 }
                    }));
                } else if (child.tagName === 'P') {
                    // This will convert strong tags to bold in docx
                    const textRuns = [];
                    child.childNodes.forEach(node => {
                        if (node.nodeType === Node.TEXT_NODE) {
                            textRuns.push(new TextRun({ text: node.textContent, size: 24 }));
                        } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'STRONG') {
                            textRuns.push(new TextRun({ text: node.textContent, bold: true, size: 24 }));
                        }
                    });
                    docChildren.push(new Paragraph({ children: textRuns }));
                } else if (child.tagName === 'UL') {
                    Array.from(child.children).forEach(li => {
                        docChildren.push(new Paragraph({
                            children: [new TextRun({ text: li.textContent, size: 24 })],
                            bullet: { level: 0 } // Standard bullet point
                        }));
                    });
                } else if (child.tagName === 'OL') {
                     let listCounter = 1;
                    Array.from(child.children).forEach(li => {
                        docChildren.push(new Paragraph({
                            children: [new TextRun({ text: `${listCounter}. ${li.textContent}`, size: 24 })],
                        }));
                        listCounter++;
                    });
                }
            });

            const doc = new Document({
                sections: [{
                    children: docChildren
                }]
            });

            const blob = await Packer.toBlob(doc);
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'ai-response.docx';
            a.click();

            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 100);
        } catch (error) {
            console.error("DOCX generation error:", error);
            showError('Failed to generate DOCX: ' + error.message);
        } finally {
            hideLoading();
        }
    }

    async function downloadAsPdf() {
        if (!aiResponse) return;

        showLoading();

        try {
            if (typeof jspdf === 'undefined') {
                throw new Error('jsPDF library not loaded. Please include it in your HTML.');
            }

            const doc = new jspdf.jsPDF();
            const content = aiOutput.querySelector('.document-content');

            if (content && typeof html2canvas !== 'undefined') {
                // Use html2canvas and jspdf's html method for better HTML rendering
                // Ensure html2canvas is loaded: <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
                await doc.html(content, {
                    callback: function (pdfDoc) {
                        pdfDoc.save('ai-response.pdf');
                    },
                    x: 10,
                    y: 10,
                    html2canvas: {
                        scale: 0.8 // Adjust scale as needed for best fit
                    },
                    autoPaging: 'text' // Ensures text flows to new pages
                });
            } else {
                // Fallback for basic text if html2canvas is not available or content is not found
                const cleanedText = aiResponse.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' '); // Strip HTML for plain text
                doc.setFontSize(18);
                doc.text("AI Generated Response", 10, 10);
                doc.setFontSize(12);
                doc.text(`Generated on ${new Date().toLocaleDateString()}`, 10, 20);
                const splitText = doc.splitTextToSize(cleanedText, 180);
                doc.text(splitText, 10, 30);
                doc.save('ai-response.pdf');
            }
        } catch (error) {
            console.error("PDF generation error:", error);
            showError('Failed to generate PDF: ' + error.message);
        } finally {
            hideLoading();
        }
    }

    // Mock AI functions - replace with real API calls in production
    async function mockAIQuestionResponse(question) {
        return new Promise(resolve => {
            setTimeout(() => {
                const responses = {
                    "What are the best exercises for knee rehabilitation?": `
                            <h3>Recommended Exercises for Knee Rehabilitation</h3>
                            <p>Based on current rehabilitation guidelines, here are some effective exercises for knee recovery:</p>

                            <h4>1. Quadriceps Sets</h4>
                            <p>Tighten your thigh muscles while keeping your knee straight. Hold for 5-10 seconds, repeat 10-15 times.</p>

                            <h4>2. Straight Leg Raises</h4>
                            <p>Lie on your back with one leg bent and the other straight. Lift the straight leg about 12 inches off the floor. Hold for 5 seconds, then lower slowly.</p>

                            <h4>3. Hamstring Curls</h4>
                            <p>Stand facing a wall for support. Bend one knee, bringing your heel toward your buttocks. Hold for 5-10 seconds, then lower slowly.</p>

                            <h4>4. Calf Raises</h4>
                            <p>Stand with feet shoulder-width apart. Rise up on your toes, then slowly lower back down.</p>

                            <h4>5. Step-Ups</h4>
                            <p>Use a small step or platform. Step up with one foot, then the other, then step down in reverse order.</p>

                            <p class="highlight">Important: Always consult with your physical therapist before starting any new exercise program, especially if you've had recent surgery or injury.</p>
                    `,
                    "How long does rehabilitation take after ACL surgery?": `
                            <h3>ACL Rehabilitation Timeline</h3>
                            <p>ACL rehabilitation typically follows this general timeline, though individual progress may vary:</p>

                            <h4>Phase 1: 0-2 Weeks Post-Op</h4>
                            <p>- Reduce swelling and pain</p>
                            <p>- Restore range of motion (especially extension)</p>
                            <p>- Begin quadriceps activation</p>

                            <h4>Phase 2: 2-6 Weeks</h4>
                            <p>- Continue improving range of motion</p>
                            <p>- Begin strength training</p>
                            <p>- Start weight-bearing exercises</p>

                            <h4>Phase 3: 6-12 Weeks</h4>
                            <p>- Progressive strengthening</p>
                            <p>- Begin proprioception and balance training</p>
                            <p>- Low-impact aerobic conditioning</p>

                            <h4>Phase 4: 3-6 Months</h4>
                            <p>- Sport-specific drills</p>
                            <p>- Plyometric training</p>
                            <p>- Continue strength and conditioning</p>

                            <h4>Return to Sport: 6-9 Months</h4>
                            <p>- Full clearance typically requires passing functional tests</p>
                            <p>- Gradual return to sport activities</p>

                            <p class="highlight">Note: Complete recovery can take 9-12 months for full return to competitive sports. Always follow your surgeon's and physical therapist's specific recommendations.</p>
                    `,
                    "default": `
                            <h3>AI Response</h3>
                            <p>Thank you for your question about "${question}". Here is a comprehensive response based on current rehabilitation best practices:</p>

                            <p>1) First consideration regarding your question...</p>
                            <p>2) Important factors to keep in mind...</p>
                            <p>3) Recommended approaches...</p>

                            <div class="summary-section">
                                <h3>Summary</h3>
                                <p>Based on the available information and current clinical guidelines, the key points are:</p>
                                <ul>
                                    <li>Key point 1</li>
                                    <li>Key point 2</li>
                                    <li>Key point 3</li>
                                </ul>
                            </div>

                            <p class="highlight">Important: This information is for educational purposes only and should not replace professional medical advice. Always consult with your healthcare provider.</p>
                    `
                };

                resolve(responses[question] || responses.default);
            }, 1500);
        });
    }

    async function mockAIDocumentResponse(prompt, text) {
        return new Promise(resolve => {
            setTimeout(() => {
                const documentType = prompt.includes('summary') ? 'Summary' :
                    prompt.includes('assessment') ? 'Assessment Report' :
                    prompt.includes('treatment') ? 'Treatment Plan' : 'Analysis';

                const response = `
                    <h2>${documentType}</h2>
                    <p>Generated on ${new Date().toLocaleDateString()}</p>

                    <div class="summary-section">
                        <h3>Executive Summary</h3>
                        <p>This document provides a ${documentType.toLowerCase()} of the uploaded content. The key findings and recommendations are summarized below:</p>
                        <ul>
                            <li>Key finding 1 extracted from the document: This is a placeholder for a key finding related to the document's content.</li>
                            <li>Key finding 2 with relevant details: Another important detail identified from the document.</li>
                            <li>Important observation noted in the text: An observation that stands out from the provided text.</li>
                        </ul>
                    </div>

                    <h3>Detailed Analysis</h3>
                    <p>Based on the document content, the following analysis has been generated:</p>

                    <p>1) First major point extracted from the document text: The document extensively discusses relevant points and provides data on various aspects.</p>
                    <p>2) Second important aspect identified: Furthermore, it highlights crucial elements and provides insights into [specific area].</p>
                    <p>3) Notable patterns or findings: Observations about trends, anomalies, or significant information found in the text.</p>

                    <h3>Recommendations</h3>
                    <p>Based on this analysis, the following recommendations are suggested:</p>
                    <ol>
                        <li>Recommended action 1 with rationale: To enhance understanding of [topic], it is recommended to [action].</li>
                        <li>Recommended action 2 with rationale: To address [challenge], consider implementing [solution].</li>
                        <li>Recommended action 3 with rationale: For optimized results, integrating [strategy] would be beneficial.</li>
                    </ol>

                    <p class="highlight">Disclaimer: This is an AI-generated analysis and should be reviewed by a human expert for accuracy and completeness.</p>
                `;

                resolve(response);
            }, 2000);
        });
    }
});
