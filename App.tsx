
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Layout } from './components/Layout';
import { AppState, ColorSwatch, ProjectRecord } from './types';
import { geminiService } from './services/geminiService';
import { backendService } from './services/backendService';
import { 
  Upload, Camera, Check, ArrowRight, Sparkles, RefreshCcw, Layers, 
  Zap, Info, Share2, Download, Settings, Plus, Trash2, Filter, X, Maximize2, 
  Edit3, Image as ImageIcon, TreePine, Palette, Waves, Gem, Lock, User, KeyRound
} from 'lucide-react';

const CATEGORIES = ['木纹', '纯色', '金属', '肤感', '大理石纹'] as const;
type CategoryType = typeof CATEGORIES[number];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  '木纹': <TreePine size={18} />,
  '纯色': <Palette size={18} />,
  '金属': <Zap size={18} />,
  '肤感': <Waves size={18} />,
  '大理石纹': <Gem size={18} />,
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    originalImage: null,
    editedImage: null,
    analysis: null,
    selectedColor: null,
    step: 'HOME',
    error: null,
    history: [],
    palettes: [],
    isAuthenticated: false,
  });

  const [activeCategory, setActiveCategory] = useState<string>(CATEGORIES[0]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loginFields, setLoginFields] = useState({ username: '', password: '' });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newBackendPassword, setNewBackendPassword] = useState('');
  
  const [newColor, setNewColor] = useState<Omit<ColorSwatch, 'id'>>({
    name: '',
    hex: '#4F46E5',
    category: CATEGORIES[0],
    finish: 'matte',
    imageUrl: undefined,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const palettes = await backendService.getPalettes();
      setState(prev => ({ ...prev, palettes }));
      
      // Debug: Check available models
      try {
        const models = await geminiService.listModels();
        if (models) {
             // @ts-ignore
             const names = models.map((m: any) => m.name || m.displayName);
             setAvailableModels(names);
             console.log("Loaded models:", names);
        }
      } catch (e) {
        console.error("Failed to load models in UI", e);
      }
    };
    loadData();
  }, []);

  const filteredPalettes = useMemo(() => {
    return state.palettes.filter(p => p.category === activeCategory);
  }, [state.palettes, activeCategory]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setState(prev => ({ ...prev, originalImage: base64, step: 'ANALYZING', error: null }));
      
      try {
        const analysis = await geminiService.analyzeFurniture(base64);
        setState(prev => ({ ...prev, analysis, step: 'CUSTOMIZE' }));
      } catch (err: any) {
        console.error("Analysis error:", err);
        setState(prev => ({ ...prev, error: `识别失败: ${err.message || "请检查网络或API Key"}`, step: 'HOME' }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!state.originalImage || !state.selectedColor || !state.analysis) return;

    setState(prev => ({ ...prev, step: 'GENERATING' }));
    try {
      const resultImage = await geminiService.editFurnitureColor(
        state.originalImage,
        state.analysis.type,
        `${state.selectedColor.category} - ${state.selectedColor.name}`,
        state.selectedColor.hex
      );
      
      const newProject: ProjectRecord = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString(),
        original: state.originalImage,
        result: resultImage,
        furnitureType: state.analysis.type,
        colorName: state.selectedColor.name,
      };

      setState(prev => ({ 
        ...prev, 
        editedImage: resultImage, 
        step: 'RESULT',
        history: [newProject, ...prev.history] 
      }));
    } catch (err: any) {
      console.error("Generate error:", err);
      setState(prev => ({ 
        ...prev, 
        error: `生成失败: ${err.message || "请检查网络或API Key"}`, 
        step: 'CUSTOMIZE' 
      }));
    }
  };

  // Update image handling logic for new uploads
  const handleSwatchImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // For preview, we still read as base64, but actual upload happens on save
    const reader = new FileReader();
    reader.onload = (event) => {
      setNewColor(prev => ({ 
        ...prev, 
        imageUrl: event.target?.result as string,
        // We store the raw file in state for upload later (this requires changing newColor type or using a separate ref)
      }));
      // Hack: Store file on the input element temporarily or use a ref
      if (fileInputRef.current) {
        (fileInputRef.current as any).file = file;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleShare = async () => {
    if (!state.editedImage) return;

    try {
      // 尝试转换 base64/url 为 Blob 以便分享文件
      const response = await fetch(state.editedImage);
      const blob = await response.blob();
      const file = new File([blob], `design-${Date.now()}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: '我的好家改造方案',
          text: `看看这个 ${state.selectedColor?.name} 的效果怎么样？`,
          files: [file]
        });
      } else {
        // 降级：复制链接或提示
        await navigator.clipboard.writeText(window.location.href);
        alert('链接已复制，快去分享给朋友吧！');
      }
    } catch (error) {
      console.error("Share failed:", error);
      // 如果文件分享失败，尝试只分享文本
      if (navigator.share) {
        navigator.share({
          title: '我的好家改造方案',
          text: '我刚刚用 AI 设计了新家，快来看看！',
          url: window.location.href
        }).catch(console.error);
      } else {
        alert('您的浏览器暂不支持直接分享，请截图发送。');
      }
    }
  };

  const handleDownload = async () => {
    if (!state.editedImage) return;
    
    try {
      const response = await fetch(state.editedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `好家改造-${state.selectedColor?.name || 'design'}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      // 降级：直接打开图片让用户长按保存
      const win = window.open();
      if (win) {
        win.document.write(`<img src="${state.editedImage}" style="width:100%"/>`);
        win.document.title = "长按保存图片";
      } else {
        alert('下载失败，请长按图片保存');
      }
    }
  };
  const handleSaveColor = async () => {
    if (!newColor.name || !newColor.hex) return;
    
    let finish: 'matte' | 'glossy' | 'wood' = 'matte';
    if (newColor.category === '木纹') finish = 'wood';
    if (['金属', '大理石纹'].includes(newColor.category)) finish = 'glossy';

    // Get the file from ref if available
    const fileToUpload = (fileInputRef.current as any)?.file as File | undefined;

    if (editingId) {
      await backendService.updateColor(editingId, { ...newColor, finish }, fileToUpload);
      const updatedPalettes = await backendService.getPalettes();
      setState(prev => ({ ...prev, palettes: updatedPalettes }));
      setEditingId(null);
    } else {
      const added = await backendService.addColor({ ...newColor, finish }, fileToUpload);
      setState(prev => ({ ...prev, palettes: [...prev.palettes, added] }));
    }
    
    // Cleanup
    if (fileInputRef.current) (fileInputRef.current as any).file = null;
    setActiveCategory(newColor.category);
    setNewColor({ name: '', hex: '#4F46E5', category: newColor.category, finish: 'matte', imageUrl: undefined });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setState(prev => ({ ...prev, error: null }));
    const success = await backendService.verifyLogin(loginFields.username, loginFields.password);
    setIsLoggingIn(false);
    if (success) {
      setState(prev => ({ ...prev, isAuthenticated: true, step: 'MANAGE' }));
      setLoginFields({ username: '', password: '' });
    } else {
      setState(prev => ({ ...prev, error: "用户名或密码错误" }));
    }
  };

  const handleChangePassword = async () => {
    if (!newBackendPassword) return;
    await backendService.updatePassword(newBackendPassword);
    setNewBackendPassword('');
    setShowPasswordChange(false);
    alert('密码修改成功');
  };

  const handleEditClick = (palette: ColorSwatch) => {
    setEditingId(palette.id);
    setNewColor({
      name: palette.name,
      hex: palette.hex,
      category: palette.category,
      finish: palette.finish,
      imageUrl: palette.imageUrl,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteColor = async (id: string) => {
    await backendService.deleteColor(id);
    setState(prev => ({ ...prev, palettes: prev.palettes.filter(p => p.id !== id) }));
  };

  const reset = () => {
    setState(prev => ({
      ...prev,
      originalImage: null,
      editedImage: null,
      analysis: null,
      selectedColor: null,
      step: 'HOME',
      error: null,
    }));
  };

  const goBack = () => {
    const steps: Record<string, any> = {
      'ANALYZING': 'HOME',
      'CUSTOMIZE': 'HOME',
      'GENERATING': 'CUSTOMIZE',
      'RESULT': 'CUSTOMIZE',
      'MANAGE': 'HOME',
      'LOGIN': 'HOME'
    };
    setState(prev => ({ ...prev, step: steps[prev.step] || 'HOME', error: null }));
  };

  return (
    <Layout 
      onBack={goBack} 
      showBack={state.step !== 'HOME'}
      title={
        state.step === 'RESULT' ? '改色完成' : 
        state.step === 'MANAGE' ? '后台管理' : 
        state.step === 'LOGIN' ? '身份验证' : undefined
      }
    >
      {state.error && (
        <div className="mb-4 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-medium animate-in fade-in slide-in-from-top">
          {state.error}
        </div>
      )}

      {state.step === 'HOME' && (
        <div className="flex-1 flex flex-col animate-in fade-in duration-500">
          <div className="flex justify-between items-start mt-4 mb-10">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 leading-tight">
                好家改造<br /><span className="text-indigo-600">家具焕新</span>
              </h2>
              <p className="mt-3 text-slate-500 text-sm leading-relaxed">
                上传实拍，实时预览木纹、金属、大理石等 2025 流行质感。
              </p>
            </div>
            <button 
              onClick={() => {
                if (state.isAuthenticated) {
                  setState(prev => ({ ...prev, step: 'MANAGE' }));
                } else {
                  setState(prev => ({ ...prev, step: 'LOGIN' }));
                }
              }}
              className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 hover:text-indigo-600 transition-colors border border-slate-100"
            >
              <Settings size={20} />
            </button>
          </div>
          
          <div className="space-y-4">
            <label className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-white hover:bg-slate-50 transition-all cursor-pointer group relative overflow-hidden active:scale-[0.98]">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                  <Upload size={28} />
                </div>
                <span className="text-sm font-bold text-slate-700">点击上传照片</span>
                <span className="text-xs text-slate-400 mt-1">支持 JPG / PNG / WebP</span>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
            </label>
            
            <label className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-slate-200 cursor-pointer">
              <Camera size={20} />
              现场拍摄
              <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                capture="environment"
                onChange={handleFileUpload} 
              />
            </label>
          </div>

          <div className="mt-12 mb-8">
             <h3 className="font-bold text-slate-800 mb-4 px-2">主打系列</h3>
             <div className="grid grid-cols-5 gap-2 px-1">
                {CATEGORIES.map(cat => (
                  <div key={cat} className="flex flex-col items-center gap-1.5 cursor-pointer" onClick={() => { setActiveCategory(cat); setState(prev => ({...prev, step: 'HOME'})); }}>
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-slate-100">
                      <div className="text-indigo-400">{CATEGORY_ICONS[cat]}</div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">{cat}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {state.step === 'LOGIN' && (
        <div className="flex-1 flex flex-col justify-center animate-in fade-in zoom-in duration-500 max-w-xs mx-auto w-full pb-20">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 mx-auto">
              <Lock size={24} />
            </div>
            <h3 className="text-xl font-bold text-center text-slate-900 mb-2">进入管理后台</h3>
            <p className="text-xs text-slate-400 text-center mb-8 font-medium">请验证您的管理员身份</p>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  required
                  placeholder="账号"
                  value={loginFields.username}
                  onChange={e => setLoginFields(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="relative">
                <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="password"
                  required
                  placeholder="密码"
                  value={loginFields.password}
                  onChange={e => setLoginFields(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <button 
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isLoggingIn ? <RefreshCcw className="animate-spin" size={18} /> : '立即登录'}
              </button>
            </form>
          </div>
        </div>
      )}

      {state.step === 'MANAGE' && (
        <div className="flex-1 flex flex-col gap-6 animate-in slide-in-from-right duration-500 pb-20">
          {/* 修改密码区块 */}
          <div className="bg-indigo-600 p-6 rounded-[2rem] shadow-lg text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold flex items-center gap-2">
                <KeyRound size={18} /> 后台设置
              </h3>
              <button 
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="text-[11px] font-bold bg-white/20 px-3 py-1 rounded-full active:scale-95 transition-transform"
              >
                {showPasswordChange ? '取消修改' : '修改密码'}
              </button>
            </div>
            {showPasswordChange && (
              <div className="mt-4 flex gap-2 animate-in slide-in-from-top">
                <input 
                  type="password"
                  placeholder="新密码"
                  value={newBackendPassword}
                  onChange={e => setNewBackendPassword(e.target.value)}
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-xs placeholder:text-white/50 focus:outline-none focus:bg-white/20"
                />
                <button 
                  onClick={handleChangePassword}
                  className="px-4 py-2 bg-white text-indigo-600 rounded-xl text-xs font-bold active:scale-95"
                >
                  确定
                </button>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
               <h3 className="font-bold text-slate-900 flex items-center gap-2">
                 {editingId ? <Edit3 size={18} className="text-indigo-600" /> : <Plus size={18} className="text-indigo-600" />} 
                 {editingId ? '编辑色卡' : '新增产品'}
               </h3>
               {editingId && (
                 <button onClick={() => {
                   setEditingId(null);
                   setNewColor({ name: '', hex: '#4F46E5', category: activeCategory, finish: 'matte', imageUrl: undefined });
                 }} className="text-xs font-bold text-slate-400">取消</button>
               )}
            </div>
            
            <div className="space-y-5">
              <div className="flex gap-4">
                 <div 
                   onClick={() => fileInputRef.current?.click()}
                   className="w-24 h-24 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors group overflow-hidden relative"
                 >
                   {newColor.imageUrl ? (
                     <img src={newColor.imageUrl} className="w-full h-full object-cover" />
                   ) : (
                     <>
                        <ImageIcon size={20} className="text-slate-300 group-hover:text-indigo-400" />
                        <span className="text-[10px] font-bold text-slate-400 mt-1">上传纹理</span>
                     </>
                   )}
                   <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleSwatchImageUpload} 
                   />
                 </div>
                 <div className="flex-1 space-y-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">色号名称</label>
                      <input 
                        type="text" 
                        value={newColor.name}
                        onChange={e => setNewColor({...newColor, name: e.target.value})}
                        placeholder="例如：胡桃木色"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">系列分类</label>
                      <select 
                        value={newColor.category}
                        onChange={e => {
                          const cat = e.target.value;
                          setNewColor({...newColor, category: cat});
                          setActiveCategory(cat);
                        }}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none"
                      >
                        {CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
                      </select>
                    </div>
                 </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">核心色值 (Hex)</label>
                <div className="flex gap-3">
                  <input 
                    type="color" 
                    value={newColor.hex}
                    onChange={e => setNewColor({...newColor, hex: e.target.value})}
                    className="w-10 h-10 rounded-xl cursor-pointer border-none p-0 bg-transparent"
                  />
                  <input 
                    type="text" 
                    value={newColor.hex}
                    onChange={e => setNewColor({...newColor, hex: e.target.value})}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>
              
              <button 
                onClick={handleSaveColor}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100 active:scale-95 transition-all"
              >
                {editingId ? '保存修改' : '保存到色卡库'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
             <div className="flex items-center justify-between px-2">
                <h3 className="font-bold text-slate-800">色卡仓库 ({state.palettes.length})</h3>
                <Filter size={16} className="text-slate-400" />
             </div>

             <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar px-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                      activeCategory === cat 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                      : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-100'
                    }`}
                  >
                    <span className={activeCategory === cat ? 'text-indigo-400' : 'text-slate-300'}>
                      {React.cloneElement(CATEGORY_ICONS[cat] as React.ReactElement, { size: 14 })}
                    </span>
                    {cat}
                  </button>
                ))}
              </div>

            <div className="grid grid-cols-1 gap-3">
              {filteredPalettes.length > 0 ? (
                filteredPalettes.map(palette => (
                  <div key={palette.id} className="bg-white p-4 rounded-2xl flex items-center justify-between border border-slate-50 shadow-sm group animate-in fade-in zoom-in duration-300">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl shadow-inner border border-slate-100 overflow-hidden relative">
                        {palette.imageUrl ? (
                          <img src={palette.imageUrl} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full" style={{ backgroundColor: palette.hex }}></div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-slate-800 text-sm">{palette.name}</p>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-indigo-400">{React.cloneElement(CATEGORY_ICONS[palette.category] as React.ReactElement, { size: 10 })}</span>
                          <span className="text-indigo-500 text-[8px] font-bold uppercase">{palette.category}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleEditClick(palette)}
                        className="p-2 text-slate-300 hover:text-indigo-500 transition-colors"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteColor(palette.id)}
                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400 font-medium">该分类暂无色卡，请在上方新增</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {state.step === 'ANALYZING' && (
        <div className="flex-1 flex flex-col items-center justify-center py-12 animate-in fade-in">
          <div className="relative mb-8">
            <div className="w-32 h-32 border-[6px] border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
              <Layers size={40} className="animate-bounce" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">正在扫描识别...</h3>
          <p className="text-slate-400 text-sm font-medium">深度解析家具轮廓与光影</p>
        </div>
      )}

      {state.step === 'CUSTOMIZE' && state.analysis && (
        <div className="flex flex-col gap-6 animate-in slide-in-from-bottom duration-500 pb-20">
          <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl group">
            <img src={state.originalImage!} alt="Original" className="w-full aspect-[4/5] object-cover" />
            <div className="absolute top-4 left-4 glass px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/40 shadow-lg">
              <Zap size={14} className="text-indigo-600 fill-indigo-600" />
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">{state.analysis.type}</span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-lg text-slate-900">产品系列</h4>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">Step 2: 选择质感</span>
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2.5 rounded-2xl text-[13px] font-bold whitespace-nowrap transition-all border flex items-center gap-2 ${
                      activeCategory === cat 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                      : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-100 shadow-sm'
                    }`}
                  >
                    <span className={activeCategory === cat ? 'text-indigo-400' : 'text-slate-300'}>
                      {CATEGORY_ICONS[cat]}
                    </span>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {filteredPalettes.length > 0 ? (
                filteredPalettes.map(color => (
                  <button
                    key={color.id}
                    onClick={() => setState(prev => ({ ...prev, selectedColor: color }))}
                    className={`group relative flex flex-col p-3 rounded-2xl border-2 transition-all ${
                      state.selectedColor?.id === color.id 
                        ? 'border-indigo-600 bg-white shadow-lg shadow-indigo-100 -translate-y-1' 
                        : 'border-transparent bg-white shadow-sm hover:bg-slate-50 border-slate-50'
                    }`}
                  >
                    <div 
                      className="w-full aspect-square rounded-xl mb-2 flex items-center justify-center overflow-hidden relative shadow-inner"
                      style={{ backgroundColor: color.hex }}
                    >
                      {color.imageUrl ? (
                        <img src={color.imageUrl} className="w-full h-full object-cover" />
                      ) : (
                        <>
                          {color.finish === 'wood' && <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>}
                          {color.category === '大理石纹' && <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/white-diamond.png')]"></div>}
                          {color.category === '金属' && <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent"></div>}
                        </>
                      )}
                      
                      {state.selectedColor?.id === color.id && (
                        <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center">
                           <div className="bg-white p-1 rounded-full text-indigo-600 shadow-md scale-110 animate-in zoom-in">
                            <Check size={14} />
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 truncate w-full text-center">
                      {color.name}
                    </span>
                  </button>
                ))
              ) : (
                <div className="col-span-3 py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                   <p className="text-xs text-slate-400 font-medium">该系列暂无色卡，请在后台添加</p>
                </div>
              )}
            </div>
          </div>

          <div className="fixed bottom-6 left-6 right-6 max-w-md mx-auto z-[70]">
            <button
              disabled={!state.selectedColor}
              onClick={handleGenerate}
              className={`w-full py-5 rounded-[1.5rem] font-bold flex items-center justify-center gap-3 transition-all shadow-2xl ${
                state.selectedColor 
                ? 'bg-indigo-600 text-white active:scale-95 translate-y-0' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed translate-y-4 opacity-0'
              }`}
            >
              <Sparkles size={20} />
              立即生成高清效果
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {state.step === 'GENERATING' && (
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center animate-in zoom-in duration-500">
          <div className="relative w-40 h-40 mb-10">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="80" cy="80" r="76" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
              <circle cx="80" cy="80" r="76" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-indigo-600" strokeDasharray="478" strokeDashoffset="120" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
               <Sparkles size={48} className="text-indigo-600 animate-pulse" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3">AI 正在深度重绘</h3>
          <div className="space-y-2 text-sm text-slate-400 font-medium max-w-[200px] mx-auto">
            <p className="animate-in slide-in-from-bottom duration-700">正在应用 {state.selectedColor?.category} 质感</p>
            <p className="animate-in slide-in-from-bottom delay-300 duration-700">确保周边软装不变</p>
            <p className="animate-in slide-in-from-bottom delay-500 duration-700">重塑自然采光阴影</p>
          </div>
        </div>
      )}

      {state.step === 'RESULT' && state.editedImage && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-700 pb-24 relative">
          <div 
            onClick={() => setIsPreviewOpen(true)}
            className="relative rounded-[2.5rem] overflow-hidden shadow-2xl aspect-[4/5] bg-slate-100 group cursor-zoom-in active:scale-[0.99] transition-transform"
          >
            <img src={state.editedImage} alt="After" className="w-full h-full object-cover" />
            
            <div className="absolute top-6 left-6 glass px-3 py-1 rounded-full text-[10px] font-bold text-indigo-600 shadow-sm border border-white/40">
              {state.selectedColor?.category} · NEW COLOR
            </div>

            <div className="absolute top-6 right-6 w-10 h-10 glass rounded-full flex items-center justify-center text-slate-600 shadow-sm border border-white/40">
               <Maximize2 size={18} />
            </div>

            <div className="absolute bottom-6 left-6 glass p-2 rounded-2xl flex items-center gap-3 border border-white/40 shadow-xl">
               <div className="w-10 h-10 rounded-xl shadow-inner overflow-hidden">
                 {state.selectedColor?.imageUrl ? (
                   <img src={state.selectedColor.imageUrl} className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full" style={{ backgroundColor: state.selectedColor?.hex }}></div>
                 )}
               </div>
               <div className="pr-2">
                  <p className="text-[10px] text-slate-400 font-bold leading-none mb-1">SELECTED COLOR</p>
                  <p className="text-sm font-bold text-slate-800 leading-none">{state.selectedColor?.name}</p>
               </div>
            </div>
          </div>

          <div className="flex gap-4 items-center">
            <div className="flex-1 bg-white p-5 rounded-[2rem] shadow-sm border border-slate-50">
              <h4 className="font-bold text-slate-900 text-sm mb-1">设计分析</h4>
              <p className="text-xs text-slate-500 leading-relaxed italic">
                {state.selectedColor?.category}质感已完美应用。在家具的轮廓边缘处呈现出自然的漫反射效果。
              </p>
            </div>
            <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-md border-2 border-white flex-shrink-0">
               <div className="relative w-full h-full">
                  <img src={state.originalImage!} alt="Original" className="w-full h-full object-cover grayscale opacity-40" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                     <span className="text-[8px] font-bold text-white tracking-widest bg-black/40 px-1.5 py-0.5 rounded uppercase font-bold">Before</span>
                  </div>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={handleShare}
              className="py-4 bg-white border border-slate-100 text-slate-800 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
            >
              <Share2 size={18} />
              分享方案
            </button>
            <button 
              onClick={handleDownload}
              className="py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Download size={18} />
              保存高清
            </button>
          </div>

          <button 
            onClick={reset}
            className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-bold flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl mt-2"
          >
            <RefreshCcw size={18} />
            开启新项目
          </button>

          {/* Fullscreen Preview Modal */}
          {isPreviewOpen && (
            <div className="fixed inset-0 preview-overlay flex items-center justify-center p-4 animate-in fade-in duration-300">
               <button 
                  onClick={() => setIsPreviewOpen(false)}
                  className="absolute top-10 right-6 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110]"
               >
                  <X size={28} />
               </button>
               <div className="relative w-full h-full flex items-center justify-center" onClick={() => setIsPreviewOpen(false)}>
                  <img 
                    src={state.editedImage} 
                    alt="Fullscreen Preview" 
                    className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-in zoom-in duration-300"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="absolute bottom-10 left-0 right-0 text-center px-10">
                     <p className="text-white/60 text-xs font-bold tracking-widest uppercase mb-1">预览模式</p>
                     <h5 className="text-white text-lg font-bold">{state.selectedColor?.category} · {state.selectedColor?.name}</h5>
                  </div>
               </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default App;
