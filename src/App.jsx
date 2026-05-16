import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, MoreVertical, Search, Filter, Plus, Film, 
  Settings, HelpCircle, LayoutGrid, Image as ImageIcon, 
  Download, ArrowRight, Sparkles, User, Key, Lock, X
} from 'lucide-react';

const DEFAULT_API_KEY = "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";

function App() {
  const [prompt, setPrompt] = useState('');
  const [generatingCount, setGeneratingCount] = useState(0);
  const [images, setImages] = useState([]);
  const [progress, setProgress] = useState(0);
  const textareaRef = useRef(null);

  // Settings Modal States
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('vision_api_key') || DEFAULT_API_KEY);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');

  // Auto-resize textarea when prompt changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [prompt]);

  // Current Date/Time formatter for the top bar
  const now = new Date();
  const dateString = now.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    let interval;
    if (generatingCount > 0) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress(p => {
          const next = p + Math.floor(Math.random() * 10) + 5;
          return next > 95 ? 95 : next;
        });
      }, 300);
    } else if (progress > 0) {
      setProgress(100);
      setTimeout(() => setProgress(0), 500);
    }
    return () => clearInterval(interval);
  }, [generatingCount]);

  // Helper to download an image
  const downloadImage = (url, prompt) => {
    const link = document.createElement('a');
    link.href = url;

    // Check for custom filename command like (filename: background)
    const filenameMatch = prompt.match(/\(filename:\s*([^)]+)\)/i);
    let finalName = '';
    
    if (filenameMatch && filenameMatch[1]) {
      finalName = filenameMatch[1].trim().replace(/[^a-z0-9_-]/gi, '_');
    } else {
      const safeName = prompt.replace(/[^a-z0-9]/gi, '_').substring(0, 30) || 'image';
      finalName = `flux_${safeName}`;
    }

    link.download = `${finalName}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Global hotkey: Shift + D to download all images
  useEffect(() => {
    const handleKeyDown = async (e) => {
      if (e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        
        if (images.length === 0) return;

        try {
          // Request user to select a directory
          const dirHandle = await window.showDirectoryPicker({
            mode: 'readwrite',
            startIn: 'downloads'
          });

          for (const img of images) {
            // Determine filename
            const filenameMatch = img.prompt.match(/\(filename:\s*([^)]+)\)/i);
            let finalName = '';
            
            if (filenameMatch && filenameMatch[1]) {
              // Extract original extension or append .jpg
              const rawName = filenameMatch[1].trim();
              if (rawName.toLowerCase().endsWith('.jpg') || rawName.toLowerCase().endsWith('.png') || rawName.toLowerCase().endsWith('.webp')) {
                finalName = rawName.replace(/[^a-z0-9_.-]/gi, '_');
              } else {
                finalName = rawName.replace(/[^a-z0-9_-]/gi, '_') + '.jpg';
              }
            } else {
              const safeName = img.prompt.replace(/[^a-z0-9]/gi, '_').substring(0, 30) || 'image';
              finalName = `flux_${safeName}.jpg`;
            }

            // Convert base64 data URL to Blob
            const base64Data = img.url.split(',')[1];
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/jpeg' });

            // Create file and write blob
            const fileHandle = await dirHandle.getFileHandle(finalName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
          }
          
          alert(`Successfully saved ${images.length} images to the selected folder!`);
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.error('Directory picking or file writing failed:', err);
            alert('Failed to save images. Ensure you granted folder permissions.');
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images]);



  const generateImage = async (e) => {
    e?.preventDefault();
    if (!prompt.trim() || generatingCount > 0) return;
    
    const currentPrompt = prompt;

    // Parse prompt for multiple quoted strings (handling both straight and curly quotes)
    let promptsToGenerate = [];
    const quoteRegex = /["“”]([^"“”]+)["“”]/g;
    let match;
    while ((match = quoteRegex.exec(currentPrompt)) !== null) {
      if (match[1].trim()) promptsToGenerate.push(match[1].trim());
    }
    
    // If no quotes found, treat the whole text as a single prompt
    if (promptsToGenerate.length === 0) {
      // Also fallback: if they just pasted multiple lines without quotes, split by newlines
      const lines = currentPrompt.split('\n').map(l => l.trim()).filter(l => l.length > 10);
      if (lines.length > 1) {
        promptsToGenerate = lines;
      } else {
        promptsToGenerate = [currentPrompt.trim()];
      }
    }

    // Expand prompts based on `--n X` flag
    let expandedPrompts = [];
    for (let p of promptsToGenerate) {
      const countMatch = p.match(/--n\s+(\d+)/i);
      if (countMatch) {
        const count = Math.min(parseInt(countMatch[1], 10), 100); // cap at 100
        const cleanP = p.replace(countMatch[0], '').trim();
        for (let i = 0; i < count; i++) {
          // If duplicating, append a hidden random seed string so they aren't identical string keys if needed
          // But our map index handles seeds anyway, so just duplicating the prompt text is fine.
          expandedPrompts.push(cleanP);
        }
      } else {
        expandedPrompts.push(p);
      }
    }
    promptsToGenerate = expandedPrompts;

    setGeneratingCount(promptsToGenerate.length);

    try {
      // Create an array of fetch promises
      const fetchPromises = promptsToGenerate.map(async (singlePrompt, index) => {
        let width = 1024;
        let height = 1024;
        let cleanPrompt = singlePrompt;

        // Regex to match aspect ratios like "16:9", "--ar 16:9", "ratio 16:9", "in 16:9 ratio"
        const ratioRegex = /(?:--ar\s+|ratio\s+|in\s+)?(\d+):(\d+)(?:\s+ratio)?/i;
        const match = singlePrompt.match(ratioRegex);

        if (match) {
          const num = parseInt(match[1]);
          const den = parseInt(match[2]);
          if (num > 0 && den > 0) {
            // Target ~1 Megapixel total area
            const targetArea = 1024 * 1024;
            const targetHeight = Math.sqrt(targetArea * den / num);
            const targetWidth = targetHeight * (num / den);
            
            // NVIDIA NIM strictly requires dimensions to be exactly one of these:
            const validSizes = [768, 832, 896, 960, 1024, 1088, 1152, 1216, 1280, 1344];
            const snap = (val) => validSizes.reduce((prev, curr) => Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev);

            width = snap(targetWidth);
            height = snap(targetHeight);

            // Remove the ratio text from the prompt sent to the model
            cleanPrompt = singlePrompt.replace(match[0], '').replace(/\s{2,}/g, ' ').trim();
          }
        }

        // Remove the filename text from the prompt sent to the model so it doesn't try to draw text
        const filenameRegex = /\(filename:\s*[^)]+\)/i;
        const filenameMatch = cleanPrompt.match(filenameRegex);
        if (filenameMatch) {
          cleanPrompt = cleanPrompt.replace(filenameMatch[0], '').replace(/\s{2,}/g, ' ').trim();
        }

        // Add a slight stagger to avoid instant rate limiting
        await new Promise(resolve => setTimeout(resolve, index * 800));

        try {
          const response = await fetch("/nvidia-image-api/v1/genai/black-forest-labs/flux.1-dev", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: JSON.stringify({
              prompt: cleanPrompt,
              width: width,
              height: height,
              // Add index to seed to ensure different seeds for identical prompts
              seed: Math.floor(Math.random() * 1000000) + index,
              steps: 50
            })
          });

          if (!response.ok) {
            console.error(`Request failed with status ${response.status}`);
            return null;
          }

          const data = await response.json();
          if (data.artifacts && data.artifacts[0] && data.artifacts[0].base64) {
            return {
              id: Date.now() + Math.random(),
              url: `data:image/jpeg;base64,${data.artifacts[0].base64}`,
              prompt: singlePrompt
            };
          }
        } catch (e) {
          console.error("Fetch error for prompt:", cleanPrompt, e);
        }
        return null;
      });

      // Wait for all image generations to complete
      const newImages = (await Promise.all(fetchPromises)).filter(Boolean);
      
      if (newImages.length > 0) {
        setImages(prev => [...newImages, ...prev]);
        setPrompt('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingCount(0);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex overflow-hidden font-sans">

      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative h-screen">
        
        {/* Top Navigation */}
        <div className="h-[60px] border-b border-white/5 flex items-center justify-between px-6 flex-shrink-0 bg-[#050505] z-20">
          
          {/* Left: Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden shadow-sm border border-white/10 flex items-center justify-center shrink-0 bg-[#141414]">
              <img src="https://res.cloudinary.com/dmdrn1bge/image/upload/v1778683419/flux_Minimal_futuristic_logo_design_joq3vp.jpg" alt="VisionFriday" className="w-full h-full object-cover scale-[1.35]" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent tracking-tight">VisionFriday</span>
          </div>

          {/* Right: Time & Profile */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-white/40">{dateString}</span>
            <button 
              onClick={() => { setIsSettingsOpen(true); setIsAuthenticated(false); setPasswordInput(''); }}
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
              title="Admin Settings"
            >
              <User className="w-4 h-4 text-white/70" />
            </button>
          </div>
        </div>

        {/* Canvas / Gallery Area */}
        <div className="flex-1 overflow-y-auto p-6 relative flex flex-col">
          
          {/* Empty State Greeting */}
          {images.length === 0 && generatingCount === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-32">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-5xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-white/80 to-white/20 tracking-tighter text-center leading-tight"
              >
                Welcome Back<br />Mr. Genius
              </motion.h1>
            </div>
          )}

          <div className="flex flex-wrap items-start gap-4 z-10 relative">
            
            {/* Generating Placeholder Cards */}
            {generatingCount > 0 && Array.from({ length: generatingCount }).map((_, i) => (
              <motion.div 
                key={`placeholder-${i}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-[320px] aspect-[3/4] rounded-2xl relative overflow-hidden flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #3a3a3c 0%, #1c1c1e 50%, #0a0a0c 100%)',
                  boxShadow: 'inset 0 0 40px rgba(255,255,255,0.05)'
                }}
              >
                {/* Gradient animation layer */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"
                  animate={{ 
                    x: ['-100%', '100%'],
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 1.5,
                    ease: "linear"
                  }}
                />
                <div className="absolute top-4 left-4 text-white/50">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div className="absolute top-4 right-4 text-sm font-medium text-white/80">
                  {progress}%
                </div>
              </motion.div>
            ))}

            {/* Generated Images */}
            <AnimatePresence>
              {images.map((img) => (
                <motion.div 
                  key={img.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-[320px] rounded-2xl overflow-hidden relative group flex-shrink-0 bg-[#141414] shadow-lg"
                >
                  <img src={img.url} alt={img.prompt} className="w-full h-auto block" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4">
                    <div className="flex justify-end">
                      <button 
                        onClick={() => downloadImage(img.url, img.prompt)}
                        className="p-2 bg-white/10 hover:bg-white/30 rounded-full text-white backdrop-blur-sm transition-colors shadow-lg"
                        title="Download Image"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-white/80 line-clamp-3">{img.prompt}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

          </div>
        </div>

        {/* Floating Prompt Bar */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[700px] max-w-[95%] z-30">
          <form 
            onSubmit={generateImage}
            className="bg-[#141414] border border-white/10 rounded-[20px] p-2 pl-4 flex items-center gap-3 shadow-2xl"
          >
            <textarea 
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  generateImage(e);
                }
              }}
              rows={1}
              className="flex-1 bg-transparent text-white outline-none placeholder:text-white/30 text-sm resize-none overflow-y-auto py-1.5 min-h-[32px] leading-tight" 
              style={{ maxHeight: '200px' }}
              placeholder="What do you want to create?" 
            />

            <button 
              type="submit"
              disabled={!prompt.trim() || generatingCount > 0}
              className="w-8 h-8 bg-white disabled:bg-white/50 text-black rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors ml-1"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Settings Modal */}
        <AnimatePresence>
          {isSettingsOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative"
              >
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                      {isAuthenticated ? <Key className="w-5 h-5 text-green-400" /> : <Lock className="w-5 h-5 text-amber-400" />}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">API Configuration</h2>
                      <p className="text-xs text-white/50">Manage your VisionFriday engine access</p>
                    </div>
                  </div>

                  {!isAuthenticated ? (
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      if (passwordInput.toLowerCase() === 'friday') {
                        setIsAuthenticated(true);
                        setApiKeyInput(apiKey);
                        setPasswordInput('');
                      } else {
                        alert('Access Denied: Incorrect Password');
                        setPasswordInput('');
                      }
                    }}>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-white/70 mb-1.5">Admin Password</label>
                          <input 
                            type="password" 
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            placeholder="Enter password..."
                            className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-white/30 transition-colors"
                            autoFocus
                          />
                        </div>
                        <button type="submit" className="w-full bg-white text-black font-bold text-sm py-2.5 rounded-lg hover:bg-gray-200 transition-colors">
                          Unlock Settings
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      setApiKey(apiKeyInput);
                      localStorage.setItem('vision_api_key', apiKeyInput);
                      setIsSettingsOpen(false);
                      setIsAuthenticated(false);
                    }}>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-white/70 mb-1.5">NVIDIA NIM API Key</label>
                          <textarea 
                            value={apiKeyInput}
                            onChange={(e) => setApiKeyInput(e.target.value)}
                            placeholder="nvapi-..."
                            rows={3}
                            className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-white/30 transition-colors font-mono resize-none"
                            autoFocus
                          />
                        </div>
                        <button type="submit" className="w-full bg-green-500 text-white font-bold text-sm py-2.5 rounded-lg hover:bg-green-600 transition-colors">
                          Save Changes
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

export default App;
