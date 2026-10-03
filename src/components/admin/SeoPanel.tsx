import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  TrendingUp, 
  Search, 
  Globe, 
  Share2, 
  FileCode, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ShieldCheck, 
  Copy, 
  ExternalLink,
  Eye,
  Settings,
  Layers,
  ArrowRight,
  Info,
  RefreshCw,
  Smartphone,
  Laptop,
  Tag,
  Link2,
  FileText,
  CornerDownRight,
  ChevronLeft,
  ChevronRight,
  Table,
  Sliders,
  Edit3
} from 'lucide-react';
import { 
  GlobalSeoSettings, 
  PageRouteSeo, 
  getGlobalSeoSettings, 
  saveGlobalSeoSettings, 
  getPageSeoList, 
  savePageSeo, 
  DEFAULT_GLOBAL_SEO,
  normalizeRobotsTxt
} from '../../services/seoService';
import { SeoJobsTab } from './SeoJobsTab';
import { SeoRedirectsTab } from './SeoRedirectsTab';

interface SeoPanelProps {
  onShowToast: (message: string) => void;
}

type SeoSubTab = 'pages' | 'jobs' | 'redirects' | 'simulator' | 'global' | 'robots';
type PageCategoryFilter = 'all' | 'core' | 'jobs' | 'legal';
type PageEditorSection = 'snippet' | 'social' | 'indexing' | 'audit';

export const SeoPanel: React.FC<SeoPanelProps> = ({ onShowToast }) => {
  const [activeSubTab, setActiveSubTab] = useState<SeoSubTab>('pages');
  const [activeEditorSection, setActiveEditorSection] = useState<PageEditorSection>('snippet');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Global Settings State
  const [globalSettings, setGlobalSettings] = useState<GlobalSeoSettings>(DEFAULT_GLOBAL_SEO);

  // Pages State
  const [pages, setPages] = useState<PageRouteSeo[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>('/');
  const [pageViewMode, setPageViewMode] = useState<'editor' | 'directory'>('editor');
  const [pageSearchFilter, setPageSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<PageCategoryFilter>('all');
  const [keywordInput, setKeywordInput] = useState<string>('');

  // Live Summary State from Server
  const [summaryStats, setSummaryStats] = useState<{
    publishedJobsCount: number;
    staticPagesCount: number;
    categoriesCount: number;
    companiesCount: number;
    totalSitemapUrls: number;
  } | null>(null);

  // Simulator Preview State
  const [simTitle, setSimTitle] = useState('');
  const [simDesc, setSimDesc] = useState('');
  const [simUrl, setSimUrl] = useState('/');
  const [simMode, setSimMode] = useState<'google_desktop' | 'google_mobile' | 'social'>('google_desktop');

  // Auto-resize textarea ref for robots.txt
  const robotsTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Load data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [g, p] = await Promise.all([getGlobalSeoSettings(), getPageSeoList()]);
        setGlobalSettings(g);
        setPages(p);
        const homePage = p.find(item => item.routePath === '/') || p[0];
        if (homePage) {
          setSelectedRoute(homePage.routePath);
          setSimTitle(homePage.metaTitle);
          setSimDesc(homePage.metaDescription);
          setSimUrl(homePage.canonicalUrl || homePage.routePath);
        }

        // Fetch live server SEO summary
        try {
          const res = await fetch('/api/seo/summary');
          if (res.ok) {
            const data = await res.json();
            setSummaryStats(data);
          }
        } catch {
          // Silent fallback
        }
      } catch (err) {
        console.error('Failed to load SEO configuration:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Adjust robots textarea height automatically
  useEffect(() => {
    if (activeSubTab === 'robots' && robotsTextareaRef.current) {
      robotsTextareaRef.current.style.height = 'auto';
      robotsTextareaRef.current.style.height = `${Math.max(220, robotsTextareaRef.current.scrollHeight + 10)}px`;
    }
  }, [activeSubTab, globalSettings.robotsTxtContent]);

  const activePage = pages.find(p => p.routePath === selectedRoute) || pages[0];

  // Update simulator when selecting a different page
  const handleSelectPage = (page: PageRouteSeo) => {
    setSelectedRoute(page.routePath);
    setSimTitle(page.metaTitle);
    setSimDesc(page.metaDescription);
    setSimUrl(page.canonicalUrl || page.routePath);
  };

  const handlePrevPage = () => {
    if (pages.length === 0) return;
    const currentIndex = pages.findIndex(p => p.routePath === selectedRoute);
    const prevIdx = (currentIndex - 1 + pages.length) % pages.length;
    handleSelectPage(pages[prevIdx]);
  };

  const handleNextPage = () => {
    if (pages.length === 0) return;
    const currentIndex = pages.findIndex(p => p.routePath === selectedRoute);
    const nextIdx = (currentIndex + 1) % pages.length;
    handleSelectPage(pages[nextIdx]);
  };

  const handleUpdateActivePage = (field: keyof PageRouteSeo, value: any) => {
    if (!activePage) return;
    const updated = { ...activePage, [field]: value };
    setPages(prev => prev.map(p => p.routePath === activePage.routePath ? updated : p));
    if (field === 'metaTitle') setSimTitle(value);
    if (field === 'metaDescription') setSimDesc(value);
  };

  const handleAddKeyword = () => {
    if (!activePage || !keywordInput.trim()) return;
    const clean = keywordInput.trim();
    if (!activePage.keywords.includes(clean)) {
      handleUpdateActivePage('keywords', [...activePage.keywords, clean]);
    }
    setKeywordInput('');
  };

  const handleRemoveKeyword = (kwToRemove: string) => {
    if (!activePage) return;
    handleUpdateActivePage('keywords', activePage.keywords.filter(kw => kw !== kwToRemove));
  };

  const handleSavePage = async () => {
    if (!activePage) return;
    try {
      setSaving(true);
      await savePageSeo(activePage);
      onShowToast(`SEO settings saved for ${activePage.pageName}!`);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to save page SEO.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGlobal = async () => {
    try {
      setSaving(true);
      const cleaned = {
        ...globalSettings,
        robotsTxtContent: normalizeRobotsTxt(globalSettings.robotsTxtContent)
      };
      setGlobalSettings(cleaned);
      await saveGlobalSeoSettings(cleaned);
      onShowToast('Global site SEO & robots.txt saved successfully!');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to save global SEO.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopySitemapUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://inaquired.app';
    navigator.clipboard.writeText(`${origin}/sitemap.xml`);
    setCopiedUrl(true);
    onShowToast('Sitemap URL copied to clipboard!');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleInsertRobotsDirective = (directiveText: string) => {
    const current = globalSettings.robotsTxtContent.trimEnd();
    const updated = `${current}\n${directiveText}\n`;
    setGlobalSettings({ ...globalSettings, robotsTxtContent: updated });
    onShowToast(`Appended directive: ${directiveText}`);
  };

  const handleResetRobots = () => {
    setGlobalSettings({
      ...globalSettings,
      robotsTxtContent: DEFAULT_GLOBAL_SEO.robotsTxtContent
    });
    onShowToast('Robots.txt restored to recommended defaults.');
  };

  // Filter pages list
  const filteredPages = useMemo(() => {
    return pages.filter(p => {
      // Category filter
      if (categoryFilter === 'core') {
        if (!['/', '/jobs', '/departments', '/companies', '/about'].includes(p.routePath)) return false;
      } else if (categoryFilter === 'jobs') {
        if (!['/remote-jobs', '/hybrid-jobs', '/internships', '/post-a-job'].includes(p.routePath)) return false;
      } else if (categoryFilter === 'legal') {
        if (!['/privacy', '/terms', '/cookies', '/contact'].includes(p.routePath)) return false;
      }

      // Search filter
      if (!pageSearchFilter) return true;
      const q = pageSearchFilter.toLowerCase();
      return p.pageName.toLowerCase().includes(q) || p.routePath.toLowerCase().includes(q);
    });
  }, [pages, categoryFilter, pageSearchFilter]);

  // Calculate audit score
  const totalPages = pages.length || 1;
  const optimizedTitles = pages.filter(p => p.metaTitle.length >= 25 && p.metaTitle.length <= 65).length;
  const optimizedDescriptions = pages.filter(p => p.metaDescription.length >= 80 && p.metaDescription.length <= 165).length;
  const hasKeywords = pages.filter(p => p.keywords && p.keywords.length > 0).length;
  const seoScore = Math.round(((optimizedTitles + optimizedDescriptions + hasKeywords) / (totalPages * 3)) * 100);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16">
        <span className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent dark:border-indigo-400" />
        <p className="mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">Loading SEO configurations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      
      {/* STICKY TOP COMMAND & NAVIGATION BAR - Prevents vertical scroll disconnect */}
      <div className="sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md pt-1 pb-3 -mt-2 -mx-2 px-2 border-b border-slate-200/80 dark:border-slate-800/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Navigation Sub-Tabs */}
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveSubTab('pages')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'pages'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
            }`}
          >
            Public Pages ({pages.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('jobs')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'jobs'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
            }`}
          >
            Job SEO &amp; Schema
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('redirects')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'redirects'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
            }`}
          >
            Redirects (301)
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('simulator')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'simulator'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
            }`}
          >
            SERP Simulator
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('global')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'global'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
            }`}
          >
            Site Defaults
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('robots')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'robots'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
            }`}
          >
            Robots &amp; Sitemap
          </button>
        </div>

        {/* Action Controls Dock (Always visible and accessible) */}
        <div className="flex items-center justify-between md:justify-end gap-2.5 shrink-0">
          
          {/* Audit Score Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 shadow-2xs">
            <Sparkles className="h-3 w-3 text-indigo-500" />
            <span>SEO Score:</span>
            <span className={`font-bold px-1.5 py-0.2 rounded-md text-[10px] ${
              seoScore >= 80 
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' 
                : seoScore >= 50
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
            }`}>
              {seoScore}%
            </span>
          </div>

          {/* Quick link to live page (for Page subtab) */}
          {activeSubTab === 'pages' && activePage && (
            <a
              href={activePage.routePath}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors shadow-2xs"
              title="Visit live page in new window"
            >
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
              <span>Preview</span>
            </a>
          )}

          {/* Primary Save Action */}
          {(activeSubTab === 'pages' || activeSubTab === 'global' || activeSubTab === 'robots' || activeSubTab === 'simulator') && (
            <button
              type="button"
              onClick={activeSubTab === 'global' || activeSubTab === 'robots' ? handleSaveGlobal : handleSavePage}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 disabled:opacity-50 transition-all cursor-pointer shrink-0"
            >
              {saving ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>

      {/* SUB-TAB 1: PUBLIC PAGES CONFIGURATION */}
      {activeSubTab === 'pages' && (
        <div className="space-y-5">
          
          {/* Top Route Switcher & Directory Mode Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs">
            
            {/* Left: Route Selector Dropdown & Prev/Next */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Page:</span>
                </span>

                <select
                  value={selectedRoute}
                  onChange={(e) => {
                    const found = pages.find(p => p.routePath === e.target.value);
                    if (found) {
                      handleSelectPage(found);
                      setPageViewMode('editor');
                    }
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white py-1.5 pl-3 pr-8 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 cursor-pointer max-w-[220px] sm:max-w-xs md:max-w-sm truncate"
                >
                  <optgroup label="Core Pages">
                    {pages.filter(p => ['/', '/about', '/contact', '/departments', '/companies'].includes(p.routePath)).map(p => (
                      <option key={p.routePath} value={p.routePath}>{p.pageName} ({p.routePath})</option>
                    ))}
                  </optgroup>
                  <optgroup label="Job Directories">
                    {pages.filter(p => ['/jobs', '/remote-jobs', '/hybrid-jobs', '/internships'].includes(p.routePath)).map(p => (
                      <option key={p.routePath} value={p.routePath}>{p.pageName} ({p.routePath})</option>
                    ))}
                  </optgroup>
                  <optgroup label="Legal & Policies">
                    {pages.filter(p => ['/privacy-policy', '/terms', '/cookie-policy', '/post-a-job'].includes(p.routePath)).map(p => (
                      <option key={p.routePath} value={p.routePath}>{p.pageName} ({p.routePath})</option>
                    ))}
                  </optgroup>
                </select>

                {/* Quick Prev / Next Arrows */}
                <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-950">
                  <button
                    type="button"
                    onClick={handlePrevPage}
                    className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    title="Previous Route"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextPage}
                    className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    title="Next Route"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Category Pills */}
              <div className="hidden sm:flex items-center gap-1">
                {(['all', 'core', 'jobs', 'legal'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                      categoryFilter === cat
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: View Switcher (Editor vs All Pages Table) */}
            <div className="flex items-center gap-2 self-end md:self-center shrink-0">
              <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100/80 p-0.5 dark:border-slate-700 dark:bg-slate-950">
                <button
                  type="button"
                  onClick={() => setPageViewMode('editor')}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    pageViewMode === 'editor'
                      ? 'bg-white text-indigo-600 shadow-2xs dark:bg-slate-800 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <Sliders className="h-3.5 w-3.5" />
                  <span>Editor View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPageViewMode('directory')}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    pageViewMode === 'directory'
                      ? 'bg-white text-indigo-600 shadow-2xs dark:bg-slate-800 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <Table className="h-3.5 w-3.5" />
                  <span>All Pages Table ({pages.length})</span>
                </button>
              </div>
            </div>

          </div>

          {/* VIEW 1: DIRECTORY OVERVIEW TABLE (All 13 Pages without trapped scroll) */}
          {pageViewMode === 'directory' && (
            <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative max-w-sm flex-1">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={pageSearchFilter}
                    onChange={(e) => setPageSearchFilter(e.target.value)}
                    placeholder="Search routes or page names..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>Showing {filteredPages.length} public pages</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
                    <tr>
                      <th className="py-3 px-4">Route &amp; Page</th>
                      <th className="py-3 px-4">SEO Title</th>
                      <th className="py-3 px-4">Meta Description</th>
                      <th className="py-3 px-4 text-center">Indexing</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                    {filteredPages.map((p) => {
                      const titleOk = p.metaTitle.length >= 25 && p.metaTitle.length <= 65;
                      const descOk = p.metaDescription.length >= 80 && p.metaDescription.length <= 165;
                      return (
                        <tr key={p.routePath} className="hover:bg-slate-50/60 dark:hover:bg-slate-950/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 dark:text-white">{p.pageName}</div>
                            <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">{p.routePath}</div>
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            <div className="truncate text-slate-800 dark:text-slate-200" title={p.metaTitle}>{p.metaTitle}</div>
                            <span className={`text-[10px] font-bold ${titleOk ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
                              {p.metaTitle.length} chars {titleOk ? '✓' : '(short/long)'}
                            </span>
                          </td>
                          <td className="py-3 px-4 max-w-sm">
                            <div className="line-clamp-2 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed" title={p.metaDescription}>{p.metaDescription}</div>
                            <span className={`text-[10px] font-bold ${descOk ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
                              {p.metaDescription.length} chars
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.noIndex 
                                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200/50'
                                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/50'
                            }`}>
                              {p.noIndex ? 'NoIndex' : 'Indexed'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                handleSelectPage(p);
                                setPageViewMode('editor');
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 dark:text-indigo-300 text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <Edit3 className="h-3 w-3" />
                              <span>Edit SEO</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 2: FULL-WIDTH SINGLE PAGE FOCUSED EDITOR (ZERO trapped scrollbars) */}
          {pageViewMode === 'editor' && activePage && (
            <div className="space-y-4">
              
              {/* Page Identity Card & Sub-navigation */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {activePage.pageName}
                      </h3>
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {activePage.routePath}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Tailor search engine title, snippet description, social share tags, and indexing directives.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSubTab('simulator');
                        setSimTitle(activePage.metaTitle);
                        setSimDesc(activePage.metaDescription);
                        setSimUrl(activePage.canonicalUrl || activePage.routePath);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white dark:border-slate-800 dark:bg-slate-950 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      <Eye className="h-3 w-3 text-indigo-500" />
                      <span>Simulate</span>
                    </button>
                  </div>
                </div>

                {/* Section Navigation Tabs to eliminate tall vertical scroll */}
                <div className="flex items-center gap-1.5 overflow-x-auto pt-1 scrollbar-thin">
                  <button
                    type="button"
                    onClick={() => setActiveEditorSection('snippet')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                      activeEditorSection === 'snippet'
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Search className="h-3.5 w-3.5" />
                    <span>Search Engine Snippet</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveEditorSection('social')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                      activeEditorSection === 'social'
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span>Social &amp; OpenGraph</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveEditorSection('indexing')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                      activeEditorSection === 'indexing'
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Directives &amp; Indexing</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveEditorSection('audit')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                      activeEditorSection === 'audit'
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Page Audit</span>
                  </button>
                </div>
              </div>

              {/* SECTION 1: SEARCH ENGINE SNIPPET */}
              {activeEditorSection === 'snippet' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-5 animate-in fade-in duration-150">
                  {/* Meta Title */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Page Meta Title <span className="text-rose-500">*</span>
                      </label>
                      <span className={`text-[10px] font-mono font-semibold ${
                        activePage.metaTitle.length > 60 
                          ? 'text-rose-500' 
                          : activePage.metaTitle.length >= 30 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : 'text-amber-500'
                      }`}>
                        {activePage.metaTitle.length} / 60 characters
                      </span>
                    </div>
                    <input
                      type="text"
                      value={activePage.metaTitle}
                      onChange={(e) => handleUpdateActivePage('metaTitle', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-900 transition-all"
                    />
                    {activePage.metaTitle.length > 60 && (
                      <p className="mt-1 text-[11px] text-rose-500">
                        Warning: Titles exceeding 60 characters may be truncated on Google Search results.
                      </p>
                    )}
                  </div>

                  {/* Meta Description */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Meta Description <span className="text-rose-500">*</span>
                      </label>
                      <span className={`text-[10px] font-mono font-semibold ${
                        activePage.metaDescription.length > 160 
                          ? 'text-rose-500' 
                          : activePage.metaDescription.length >= 80 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : 'text-amber-500'
                      }`}>
                        {activePage.metaDescription.length} / 158 characters
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={activePage.metaDescription}
                      onChange={(e) => handleUpdateActivePage('metaDescription', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-900 leading-relaxed transition-all"
                    />
                  </div>

                  {/* Keywords */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Target Keywords &amp; Search Queries
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddKeyword();
                          }
                        }}
                        placeholder="e.g. remote engineer jobs (press Enter)"
                        className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-900"
                      />
                      <button
                        type="button"
                        onClick={handleAddKeyword}
                        className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-semibold cursor-pointer"
                      >
                        Add
                      </button>
                    </div>

                    {activePage.keywords && activePage.keywords.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {activePage.keywords.map((kw) => (
                          <span
                            key={kw}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/60 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/60"
                          >
                            <span>{kw}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveKeyword(kw)}
                              className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200 cursor-pointer"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION 2: SOCIAL & OPENGRAPH */}
              {activeEditorSection === 'social' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-5 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      OpenGraph Title (og:title)
                    </label>
                    <input
                      type="text"
                      value={activePage.ogTitle || ''}
                      onChange={(e) => handleUpdateActivePage('ogTitle', e.target.value)}
                      placeholder={activePage.metaTitle || 'Defaults to Meta Title'}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      OpenGraph Description (og:description)
                    </label>
                    <textarea
                      rows={2}
                      value={activePage.ogDescription || ''}
                      onChange={(e) => handleUpdateActivePage('ogDescription', e.target.value)}
                      placeholder={activePage.metaDescription || 'Defaults to Meta Description'}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      OpenGraph Social Banner Image URL (og:image)
                    </label>
                    <input
                      type="text"
                      value={activePage.ogImageUrl || ''}
                      onChange={(e) => handleUpdateActivePage('ogImageUrl', e.target.value)}
                      placeholder="e.g. https://yourdomain.com/og/cover.png"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-xs font-mono text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        OpenGraph Type
                      </label>
                      <select
                        value={activePage.ogType || 'website'}
                        onChange={(e) => handleUpdateActivePage('ogType', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-900"
                      >
                        <option value="website">website (Standard Page)</option>
                        <option value="article">article (Blog / Guide)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Twitter Card Type
                      </label>
                      <select
                        value={activePage.twitterCard || 'summary_large_image'}
                        onChange={(e) => handleUpdateActivePage('twitterCard', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-900"
                      >
                        <option value="summary_large_image">summary_large_image (Large Banner)</option>
                        <option value="summary">summary (Compact Card)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 3: DIRECTIVES & CANONICAL */}
              {activeEditorSection === 'indexing' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-5 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Canonical URL Tag
                    </label>
                    <input
                      type="text"
                      value={activePage.canonicalUrl || ''}
                      onChange={(e) => handleUpdateActivePage('canonicalUrl', e.target.value)}
                      placeholder={`e.g. ${activePage.routePath} or https://yourdomain.com${activePage.routePath}`}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-xs font-mono text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-900"
                    />
                    <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                      Prevents duplicate content penalties by indicating the primary authoritative URL to Google.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
                      Search Engine Crawler Directives
                    </span>

                    <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/40 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activePage.noIndex}
                        onChange={(e) => handleUpdateActivePage('noIndex', e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                          Block Indexing (noindex)
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Instructs search engine bots NOT to index this page in search results.
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/40 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activePage.noFollow}
                        onChange={(e) => handleUpdateActivePage('noFollow', e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                          Do Not Follow Outbound Links (nofollow)
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Instructs bots not to pass PageRank or crawl links found on this page.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* SECTION 4: PAGE AUDIT */}
              {activeEditorSection === 'audit' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-4 animate-in fade-in duration-150">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Automated SEO Quality Checklist
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Title Length (30-60 ch)
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        activePage.metaTitle.length >= 30 && activePage.metaTitle.length <= 60
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}>
                        {activePage.metaTitle.length} chars
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Description Length (80-160 ch)
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        activePage.metaDescription.length >= 80 && activePage.metaDescription.length <= 160
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}>
                        {activePage.metaDescription.length} chars
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Target Keyword Tags
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        activePage.keywords && activePage.keywords.length > 0
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}>
                        {activePage.keywords?.length || 0} active
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Search Indexing
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        !activePage.noIndex
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}>
                        {!activePage.noIndex ? 'Indexable' : 'Excluded'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* SUB-TAB: JOB OPENINGS SEO */}
      {activeSubTab === 'jobs' && (
        <SeoJobsTab
          onShowToast={onShowToast}
          siteName={globalSettings.siteName}
        />
      )}

      {/* SUB-TAB: REDIRECTS (301) */}
      {activeSubTab === 'redirects' && (
        <SeoRedirectsTab
          onShowToast={onShowToast}
        />
      )}

      {/* SUB-TAB 2: SERP & SOCIAL SIMULATOR */}
      {activeSubTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Controls */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Simulator Controls
            </h3>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSimMode('google_desktop')}
                className={`flex-1 py-2 px-2 text-xs font-semibold rounded-xl border cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${
                  simMode === 'google_desktop'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                    : 'border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-400'
                }`}
              >
                <Laptop className="h-3.5 w-3.5" />
                <span>Desktop</span>
              </button>

              <button
                type="button"
                onClick={() => setSimMode('google_mobile')}
                className={`flex-1 py-2 px-2 text-xs font-semibold rounded-xl border cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${
                  simMode === 'google_mobile'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                    : 'border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-400'
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Mobile</span>
              </button>

              <button
                type="button"
                onClick={() => setSimMode('social')}
                className={`flex-1 py-2 px-2 text-xs font-semibold rounded-xl border cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${
                  simMode === 'social'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                    : 'border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-400'
                }`}
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>Social</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Preview Title
              </label>
              <input
                type="text"
                value={simTitle}
                onChange={(e) => setSimTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Preview Description
              </label>
              <textarea
                rows={3}
                value={simDesc}
                onChange={(e) => setSimDesc(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Preview URL
              </label>
              <input
                type="text"
                value={simUrl}
                onChange={(e) => setSimUrl(e.target.value)}
                placeholder="e.g. / or /jobs"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs font-mono text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-900"
              />
            </div>
          </div>

          {/* Live Output */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Live SERP Simulation Preview
            </h3>

            {simMode === 'google_desktop' && (
              <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs text-slate-900 font-sans">
                <div className="flex items-center gap-2 text-xs text-slate-700 mb-1">
                  <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">i</div>
                  <div>
                    <span className="font-semibold block leading-tight">inaquired</span>
                    <span className="text-[11px] text-slate-500">https://inaquired.app{simUrl.startsWith('/') ? simUrl : `/${simUrl}`}</span>
                  </div>
                </div>
                <div className="text-lg text-indigo-700 hover:underline cursor-pointer font-normal leading-snug">
                  {simTitle || 'Page Title'}
                </div>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed max-w-xl">
                  {simDesc || 'Page meta description snippet as displayed in Google search results.'}
                </p>
              </div>
            )}

            {simMode === 'google_mobile' && (
              <div className="max-w-sm mx-auto rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm text-slate-900 font-sans">
                <div className="flex items-center gap-2 text-xs text-slate-700 mb-1">
                  <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">i</div>
                  <div>
                    <span className="font-semibold block text-[11px]">inaquired</span>
                    <span className="text-[10px] text-slate-500">https://inaquired.app{simUrl.startsWith('/') ? simUrl : `/${simUrl}`}</span>
                  </div>
                </div>
                <div className="text-base text-indigo-700 font-normal leading-snug">
                  {simTitle || 'Page Title'}
                </div>
                <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">
                  {simDesc || 'Page meta description snippet as displayed on mobile Google search.'}
                </p>
              </div>
            )}

            {simMode === 'social' && (
              <div className="max-w-md rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-950 text-white overflow-hidden shadow-lg">
                <div className="h-44 bg-gradient-to-tr from-slate-900 via-indigo-950 to-indigo-900 flex flex-col items-center justify-center p-6 text-center">
                  <span className="text-2xl font-extrabold tracking-tight text-white">inaquired</span>
                  <span className="text-xs text-indigo-200 mt-1">Verified Career Discovery Platform</span>
                </div>
                <div className="p-3.5 bg-slate-900 border-t border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    inaquired.app{simUrl.startsWith('/') ? simUrl : `/${simUrl}`}
                  </span>
                  <div className="text-sm font-bold text-white mt-0.5 line-clamp-1">
                    {simTitle || 'Page Title'}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                    {simDesc || 'Social sharing description.'}
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* SUB-TAB 3: SITE DEFAULTS & WEBMASTER TOOLS */}
      {activeSubTab === 'global' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Global Site Metadata &amp; Search Console Verification
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              These settings serve as fallback defaults across all unconfigured routes and provide Google Search Console ownership verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Site Name
              </label>
              <input
                type="text"
                value={globalSettings.siteName}
                onChange={(e) => setGlobalSettings({ ...globalSettings, siteName: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Title Separator
              </label>
              <input
                type="text"
                value={globalSettings.titleSeparator}
                onChange={(e) => setGlobalSettings({ ...globalSettings, titleSeparator: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-900"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Default Meta Title
              </label>
              <input
                type="text"
                value={globalSettings.defaultTitle}
                onChange={(e) => setGlobalSettings({ ...globalSettings, defaultTitle: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-900"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Default Meta Description
              </label>
              <textarea
                rows={3}
                value={globalSettings.defaultDescription}
                onChange={(e) => setGlobalSettings({ ...globalSettings, defaultDescription: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Google Site Verification Code
              </label>
              <input
                type="text"
                value={globalSettings.googleSiteVerification || ''}
                onChange={(e) => setGlobalSettings({ ...globalSettings, googleSiteVerification: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-xs font-mono text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-900"
              />
              <p className="mt-1 text-[10px] text-slate-400">
                Injected into &lt;meta name="google-site-verification" content="..."&gt;
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Bing Webmaster Verification Code
              </label>
              <input
                type="text"
                value={globalSettings.bingSiteVerification || ''}
                onChange={(e) => setGlobalSettings({ ...globalSettings, bingSiteVerification: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-xs font-mono text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-900"
              />
              <p className="mt-1 text-[10px] text-slate-400">
                Injected into &lt;meta name="msvalidate.01" content="..."&gt;
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Twitter / X Creator Handle
              </label>
              <input
                type="text"
                value={globalSettings.twitterHandle}
                onChange={(e) => setGlobalSettings({ ...globalSettings, twitterHandle: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-xs font-mono text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Default OpenGraph Image URL
              </label>
              <input
                type="text"
                value={globalSettings.defaultOgImageUrl || ''}
                onChange={(e) => setGlobalSettings({ ...globalSettings, defaultOgImageUrl: e.target.value })}
                placeholder="e.g. https://yourdomain.com/og-image.png (optional)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-xs font-mono text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-900 placeholder:text-slate-400 placeholder:font-sans"
              />
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: ROBOTS.TXT & SITEMAP (Fixed multiline, no nested scroll, with live test endpoints) */}
      {activeSubTab === 'robots' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Robots.txt Editor */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Robots.txt Directives
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Controls crawling permissions for search engine bots (Googlebot, Bingbot, etc.).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="/robots.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/60 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800/80 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/50 text-xs font-semibold transition-colors cursor-pointer"
                  title="View live text output from /robots.txt"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>View Live robots.txt</span>
                </a>
              </div>
            </div>

            {/* Quick Directive Injector Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                Quick Inject:
              </span>
              <button
                type="button"
                onClick={() => handleInsertRobotsDirective('Disallow: /admin\nDisallow: /admin/*')}
                className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
              >
                + Disallow /admin
              </button>
              <button
                type="button"
                onClick={() => handleInsertRobotsDirective('Disallow: /api/')}
                className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
              >
                + Disallow /api/
              </button>
              <button
                type="button"
                onClick={() => handleInsertRobotsDirective('Allow: /')}
                className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
              >
                + Allow All (/)
              </button>
              <button
                type="button"
                onClick={() => handleInsertRobotsDirective('Sitemap: /sitemap.xml')}
                className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
              >
                + Sitemap Ref
              </button>
              <button
                type="button"
                onClick={handleResetRobots}
                className="ml-auto px-2 py-1 rounded-lg text-[10px] font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 cursor-pointer"
              >
                Reset Default
              </button>
            </div>

            {/* Auto-Expanding multiline textarea (No internal scrollbar) */}
            <div className="relative">
              <textarea
                ref={robotsTextareaRef}
                value={globalSettings.robotsTxtContent}
                onChange={(e) => {
                  setGlobalSettings({ ...globalSettings, robotsTxtContent: e.target.value });
                  if (robotsTextareaRef.current) {
                    robotsTextareaRef.current.style.height = 'auto';
                    robotsTextareaRef.current.style.height = `${robotsTextareaRef.current.scrollHeight + 10}px`;
                  }
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-4 font-mono text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-900 leading-relaxed resize-none overflow-hidden"
                placeholder="User-agent: *&#10;Allow: /&#10;Disallow: /admin&#10;&#10;Sitemap: /sitemap.xml"
              />
            </div>

            <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
              <span>Lines: {globalSettings.robotsTxtContent.split('\n').filter(Boolean).length} directives</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Live endpoint active at /robots.txt
              </span>
            </div>
          </div>

          {/* XML Sitemap Status Card */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Live XML Sitemap Feed
              </h3>
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Dynamic Active
              </span>
            </div>

            {/* Sitemap Endpoint Box with Copy & Open */}
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60 space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Primary Sitemap URL
              </span>
              <div className="font-mono text-xs text-indigo-600 dark:text-indigo-400 break-all select-all font-semibold">
                {typeof window !== 'undefined' ? `${window.location.origin}/sitemap.xml` : '/sitemap.xml'}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopySitemapUrl}
                  className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  {copiedUrl ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedUrl ? 'Copied!' : 'Copy URL'}</span>
                </button>

                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Open Feed</span>
                </a>
              </div>
            </div>

            {/* Real-time Content Breakdown */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Included in Sitemap:
              </span>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-indigo-500" />
                    Core Public Pages
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {summaryStats ? summaryStats.staticPagesCount : 13} URLs
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-emerald-500" />
                    Published Job Detail Pages
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {summaryStats ? summaryStats.publishedJobsCount : 'Dynamic (Live)'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5 text-amber-500" />
                    Department Directories
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {summaryStats ? summaryStats.categoriesCount : 'Dynamic (Live)'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5 text-purple-500" />
                    Active Hiring Companies
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {summaryStats ? summaryStats.companiesCount : 'Dynamic (Live)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Google Search Console Guidance */}
            <div className="p-3 rounded-xl border border-indigo-100 bg-indigo-50/50 dark:border-indigo-900/50 dark:bg-indigo-950/30 text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <span className="font-bold text-indigo-900 dark:text-indigo-200 block text-[11px] flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                Google Search Console Ready
              </span>
              <p className="text-[11px] leading-relaxed">
                Submit your sitemap URL directly in Google Search Console under <span className="font-mono text-indigo-600 dark:text-indigo-300">Index &gt; Sitemaps</span> for instant crawling and fast indexing of new job listings.
              </p>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
