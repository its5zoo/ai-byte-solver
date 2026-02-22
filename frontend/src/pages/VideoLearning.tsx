import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Bookmark, History, PlayCircle, Loader2 } from 'lucide-react';
import api from '../lib/api';

interface VideoItem {
    videoId: string;
    title: string;
    thumbnail: string;
    channelTitle: string;
    duration: string;
    type?: 'video' | 'playlist';
    watchedAt?: string;
    savedAt?: string;
}

export default function VideoLearning() {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'search' | 'history' | 'saved'>('search');
    const [searchResults, setSearchResults] = useState<{ videos: VideoItem[], playlists: VideoItem[] }>({ videos: [], playlists: [] });
    const [history, setHistory] = useState<VideoItem[]>([]);
    const [saved, setSaved] = useState<VideoItem[]>([]);
    const [currentVideo, setCurrentVideo] = useState<VideoItem | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'history') fetchHistory();
        if (activeTab === 'saved') fetchSaved();
    }, [activeTab]);

    const fetchHistory = async () => {
        try {
            const { data } = await api.get('/videos/history');
            setHistory(data.history || []);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchSaved = async () => {
        try {
            const { data } = await api.get('/videos/saved');
            setSaved(data.saved || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        setCurrentVideo(null); // Reset player to show results
        try {
            const { data } = await api.get(`/videos/search?q=${encodeURIComponent(query)}`);
            setSearchResults(data);
            setActiveTab('search');
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const playVideo = async (video: VideoItem) => {
        setCurrentVideo(video);
        try {
            await api.post('/videos/history', {
                videoId: video.videoId,
                title: video.title,
                thumbnail: video.thumbnail,
                channelTitle: video.channelTitle,
                duration: video.duration,
            });
            if (activeTab === 'history') fetchHistory();
        } catch (err) {
            console.error(err);
        }
    };

    const toggleSave = async (e: React.MouseEvent, video: VideoItem) => {
        e.stopPropagation();
        try {
            const { data } = await api.post('/videos/saved', {
                videoId: video.videoId,
                title: video.title,
                thumbnail: video.thumbnail,
                channelTitle: video.channelTitle,
                duration: video.duration,
                type: video.type || 'video',
            });
            setSaved(data.saved || []);
            if (activeTab === 'saved') fetchSaved();
        } catch (err) {
            console.error(err);
        }
    };

    const isSaved = (videoId: string) => saved.some(s => s.videoId === videoId);

    // Initialize saved state occasionally so buttons work
    useEffect(() => {
        fetchSaved();
    }, []);

    const renderVideoGrid = (items: VideoItem[], title?: string) => {
        if (items.length === 0) return null;
        return (
            <div className="mb-8">
                {title && <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-4 ml-2">{title}</h3>}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-2">
                    {items.map((item, i) => {
                        const savedState = isSaved(item.videoId);
                        return (
                            <div
                                key={`${item.videoId}-${i}`}
                                className="group relative flex flex-col rounded-2xl bg-[hsl(var(--card))] overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 border border-[hsl(var(--border)_/_0.5)] hover:border-[hsl(var(--primary)_/_0.5)] transform hover:-translate-y-1"
                                onClick={() => playVideo(item)}
                            >
                                <div className="relative aspect-video w-full overflow-hidden bg-black">
                                    <img
                                        src={item.thumbnail}
                                        alt={item.title}
                                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <PlayCircle className="w-14 h-14 text-white drop-shadow-lg" />
                                    </div>
                                    <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-xs font-medium text-white shadow-sm">
                                        {item.duration}
                                    </div>
                                    {item.type === 'playlist' && (
                                        <div className="absolute top-2 left-2 bg-[hsl(var(--primary))] px-2 py-0.5 rounded text-xs font-semibold text-white shadow-sm flex items-center gap-1">
                                            <ListVideo className="w-3 h-3" /> Playlist
                                        </div>
                                    )}
                                    <button
                                        onClick={(e) => toggleSave(e, item)}
                                        className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-md transition-all duration-200 ${savedState ? 'bg-[hsl(var(--primary))] text-white' : 'bg-black/50 text-white hover:bg-[hsl(var(--primary)_/_0.8)] opacity-0 group-hover:opacity-100'}`}
                                    >
                                        <Bookmark className="w-4 h-4" fill={savedState ? "currentColor" : "none"} />
                                    </button>
                                </div>
                                <div className="p-4 flex flex-col flex-1">
                                    <h4 className="font-semibold text-[hsl(var(--foreground))] line-clamp-2 leading-tight group-hover:text-[hsl(var(--primary))] transition-colors">
                                        {item.title}
                                    </h4>
                                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2 truncate">
                                        {item.channelTitle}
                                    </p>
                                    {item.watchedAt && (
                                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-auto pt-2 opacity-70">
                                            Watched: {new Date(item.watchedAt).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[hsl(var(--background))]">
            {/* Left Sidebar Lite */}
            <div className="w-64 border-r border-[hsl(var(--border))] flex flex-col bg-[hsl(var(--card)_/_0.3)] backdrop-blur-sm relative z-10">
                <div className="p-4 border-b border-[hsl(var(--border))]">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors w-full px-3 py-2 rounded-lg hover:bg-[hsl(var(--accent))]"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </button>
                </div>

                <div className="p-4 flex flex-col gap-2">
                    <button
                        onClick={() => setActiveTab('search')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'search' ? 'bg-[hsl(var(--primary)_/_0.15)] text-[hsl(var(--primary))] font-medium' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]'}`}
                    >
                        <Search className="w-5 h-5" /> Discover
                    </button>
                    <button
                        onClick={() => { setActiveTab('saved'); setCurrentVideo(null); }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'saved' ? 'bg-[hsl(var(--primary)_/_0.15)] text-[hsl(var(--primary))] font-medium' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]'}`}
                    >
                        <Bookmark className="w-5 h-5" /> Saved
                    </button>
                    <button
                        onClick={() => { setActiveTab('history'); setCurrentVideo(null); }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'history' ? 'bg-[hsl(var(--primary)_/_0.15)] text-[hsl(var(--primary))] font-medium' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]'}`}
                    >
                        <History className="w-5 h-5" /> History
                    </button>
                </div>

                <div className="mt-auto p-6 bg-gradient-to-t from-[hsl(var(--background))] to-transparent">
                    <div className="rounded-2xl bg-gradient-to-br from-[hsl(var(--primary)_/_0.1)] to-[hsl(var(--primary)_/_0.05)] border border-[hsl(var(--primary)_/_0.2)] p-4 relative overflow-hidden">
                        <div className="absolute -top-6 -right-6 w-24 h-24 bg-[hsl(var(--primary)_/_0.2)] rounded-full blur-2xl"></div>
                        <h4 className="font-semibold text-[hsl(var(--foreground))] mb-1 relative z-10">Structured Learning</h4>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed relative z-10">
                            Skip the YouTube rabbit hole. Search for topics like DSA or OS to find curated playlists and videos.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[hsl(var(--primary)_/_0.03)] rounded-full blur-[100px] pointer-events-none -z-10"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[hsl(var(--primary)_/_0.05)] rounded-full blur-[100px] pointer-events-none -z-10"></div>

                {/* Header / Search Area */}
                <div className="border-b border-[hsl(var(--border)_/_0.5)] bg-[hsl(var(--background)_/_0.8)] backdrop-blur-xl sticky top-0 z-20">
                    <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-[hsl(var(--foreground))] to-[hsl(var(--foreground)_/_0.7)] bg-clip-text text-transparent hidden sm:block">
                            {activeTab === 'search' ? 'Discover' : activeTab === 'saved' ? 'Saved Videos' : 'Watch History'}
                        </h2>

                        <form onSubmit={handleSearch} className="flex-1 max-w-2xl relative group">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Search className={`w-5 h-5 transition-colors ${isLoading ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))] group-focus-within:text-[hsl(var(--primary))]'}`} />
                            </div>
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search topics e.g. 'Dynamic Programming in C++'..."
                                className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-[hsl(var(--accent)_/_0.5)] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)_/_0.3)] focus:border-[hsl(var(--primary))] transition-all shadow-sm"
                            />
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="absolute inset-y-1.5 right-1.5 px-4 rounded-xl bg-[hsl(var(--primary))] text-primary-foreground font-medium hover:bg-[hsl(var(--primary)_/_0.9)] transition-colors disabled:opacity-50 flex items-center shadow-sm"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Content Scroll Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="max-w-7xl mx-auto px-6 py-8">

                        {/* Player View */}
                        {currentVideo && (
                            <div className="mb-10 w-full max-w-5xl mx-auto">
                                <div className="group relative rounded-3xl overflow-hidden bg-black shadow-2xl border border-[hsl(var(--border)_/_0.3)] ring-1 ring-white/10">
                                    <div className="aspect-video w-full relative">
                                        <iframe
                                            src={`https://www.youtube.com/embed/${currentVideo.videoId}?autoplay=1&rel=0&modestbranding=1&autohide=1${currentVideo.type === 'playlist' ? '&listType=playlist&list=' + currentVideo.videoId : ''}`}
                                            title="YouTube video player"
                                            className="absolute inset-0 w-full h-full border-0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        ></iframe>
                                    </div>
                                    <div className="p-6 bg-gradient-to-b from-black/80 to-black text-white">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h2 className="text-2xl font-bold leading-tight mb-2">{currentVideo.title}</h2>
                                                <p className="text-[hsl(var(--muted-foreground))] font-medium">{currentVideo.channelTitle}</p>
                                            </div>
                                            <button
                                                onClick={(e) => toggleSave(e, currentVideo)}
                                                className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${isSaved(currentVideo.videoId) ? 'bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary)_/_0.9)]' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                            >
                                                <Bookmark className="w-4 h-4" fill={isSaved(currentVideo.videoId) ? "currentColor" : "none"} />
                                                {isSaved(currentVideo.videoId) ? 'Saved' : 'Save'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex items-center justify-between border-b border-[hsl(var(--border))] pb-4">
                                    <h3 className="text-xl font-semibold text-[hsl(var(--foreground))]">Up Next</h3>
                                    <button onClick={() => setCurrentVideo(null)} className="text-sm text-[hsl(var(--primary))] hover:underline font-medium">Back to Results</button>
                                </div>
                            </div>
                        )}

                        {/* Results Grids */}
                        {!currentVideo && isLoading && (
                            <div className="flex flex-col items-center justify-center py-20 opacity-60">
                                <Loader2 className="w-12 h-12 animate-spin text-[hsl(var(--primary))] mb-4" />
                                <p className="text-[hsl(var(--muted-foreground))] font-medium">Curating structured lessons for you...</p>
                            </div>
                        )}

                        {!isLoading && activeTab === 'search' && (
                            <>
                                {searchResults.playlists.length > 0 && renderVideoGrid(searchResults.playlists, 'Structured Playlists')}
                                {searchResults.videos.length > 0 && renderVideoGrid(searchResults.videos, 'Top Videos')}

                                {searchResults.playlists.length === 0 && searchResults.videos.length === 0 && query && (
                                    <div className="text-center py-20">
                                        <div className="w-24 h-24 bg-[hsl(var(--accent))] rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Search className="w-10 h-10 text-[hsl(var(--muted-foreground))]" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">No results found</h3>
                                        <p className="text-[hsl(var(--muted-foreground))]">Try adjusting your search terms or exploring broader topics.</p>
                                    </div>
                                )}

                                {!query && searchResults.playlists.length === 0 && searchResults.videos.length === 0 && (
                                    <div className="text-center py-32 max-w-lg mx-auto">
                                        <div className="w-24 h-24 bg-gradient-to-br from-[hsl(var(--primary)_/_0.2)] to-transparent rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-[hsl(var(--primary)_/_0.1)] shadow-xl shadow-[hsl(var(--primary)_/_0.05)] transform -rotate-6">
                                            <PlayCircle className="w-10 h-10 text-[hsl(var(--primary))] transform rotate-6" />
                                        </div>
                                        <h3 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-4">What do you want to master today?</h3>
                                        <p className="text-[hsl(var(--muted-foreground))] text-lg">Search for structured content like Data Structures, Machine Learning, or Web Development.</p>
                                    </div>
                                )}
                            </>
                        )}

                        {!isLoading && activeTab === 'history' && (
                            <>
                                {renderVideoGrid(history, '')}
                                {history.length === 0 && (
                                    <div className="text-center py-20 opacity-80">
                                        <div className="w-20 h-20 bg-[hsl(var(--accent))] rounded-2xl flex items-center justify-center mx-auto mb-6">
                                            <History className="w-8 h-8 text-[hsl(var(--muted-foreground))]" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-2">No watch history yet</h3>
                                        <p className="text-[hsl(var(--muted-foreground))]">Videos you watch will appear here.</p>
                                    </div>
                                )}
                            </>
                        )}

                        {!isLoading && activeTab === 'saved' && (
                            <>
                                {renderVideoGrid(saved, '')}
                                {saved.length === 0 && (
                                    <div className="text-center py-20 opacity-80">
                                        <div className="w-20 h-20 bg-[hsl(var(--accent))] rounded-2xl flex items-center justify-center mx-auto mb-6">
                                            <Bookmark className="w-8 h-8 text-[hsl(var(--muted-foreground))]" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-2">Your library is empty</h3>
                                        <p className="text-[hsl(var(--muted-foreground))]">Save helpful videos and playlists to find them easily later.</p>
                                    </div>
                                )}
                            </>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}

// Simple icon for playlist
function ListVideo(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 12H3" />
            <path d="M16 6H3" />
            <path d="M12 18H3" />
            <path d="m16 12 5 3-5 3v-6Z" />
        </svg>
    );
}
