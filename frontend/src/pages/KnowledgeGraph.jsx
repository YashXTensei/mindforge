import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchGraphData, fetchTopicClaims, analyzeGap } from '../api/graph';
import {
    Share2, AlertCircle, Loader2, X, ChevronRight,
    Target, AlertTriangle, CheckCircle, BookOpen,
    ArrowRight, ZoomIn, ZoomOut, Maximize2
} from 'lucide-react';

// ── Color helpers (same logic as Topics.jsx) ──
const getConfidenceColor = (confidence) => {
    if (confidence >= 70) return '#34d399';   // emerald-400
    if (confidence >= 40) return '#fbbf24';   // yellow-400
    return '#f87171';                          // red-400
};

const getConfidenceLabel = (confidence) => {
    if (confidence >= 70) return 'Strong';
    if (confidence >= 40) return 'Learning';
    return 'Weak';
};

// ── Graph Component (loaded dynamically) ──
// react-force-graph-2d is heavy, so we lazy-load it
const ForceGraph2D = React.lazy(() => import('react-force-graph-2d'));

export default function KnowledgeGraph() {
    const graphRef = useRef();
    const [selectedNode, setSelectedNode] = useState(null);
    const [claims, setClaims] = useState([]);
    const [claimsLoading, setClaimsLoading] = useState(false);
    const [gapResult, setGapResult] = useState(null);
    const [gapLoading, setGapLoading] = useState(false);
    const [highlightNodes, setHighlightNodes] = useState(new Set());
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const containerRef = useRef();

    // Fetch graph data
    const { data: graphData, isLoading, isError, error } = useQuery({
        queryKey: ['graph-network'],
        queryFn: fetchGraphData,
    });

    // ── Responsive canvas sizing ──
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setDimensions({
                    width: rect.width,
                    height: rect.height,
                });
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    // ── Node click → fetch claims + show side panel ──
    const handleNodeClick = useCallback(async (node) => {
        setSelectedNode(node);
        setGapResult(null);
        setClaimsLoading(true);
        try {
            const data = await fetchTopicClaims(node.id);
            setClaims(data);
        } catch (err) {
            console.error('Failed to fetch claims:', err);
            setClaims([]);
        } finally {
            setClaimsLoading(false);
        }
    }, []);

    // ── Gap Analysis ──
    const handleGapAnalysis = useCallback(async (topicId) => {
        setGapLoading(true);
        try {
            const result = await analyzeGap(topicId);
            setGapResult(result);

            // Highlight the path nodes in the graph
            const pathNodeIds = new Set();
            result.missing?.forEach(n => pathNodeIds.add(n.id));
            result.weak?.forEach(n => pathNodeIds.add(n.id));
            result.ready?.forEach(n => pathNodeIds.add(n.id));
            pathNodeIds.add(topicId);
            setHighlightNodes(pathNodeIds);
        } catch (err) {
            console.error('Gap analysis failed:', err);
        } finally {
            setGapLoading(false);
        }
    }, []);

    // ── Close side panel ──
    const closeSidePanel = () => {
        setSelectedNode(null);
        setClaims([]);
        setGapResult(null);
        setHighlightNodes(new Set());
    };

    // ── Graph zoom controls ──
    const handleZoomIn = () => graphRef.current?.zoom(graphRef.current.zoom() * 1.3, 300);
    const handleZoomOut = () => graphRef.current?.zoom(graphRef.current.zoom() * 0.7, 300);
    const handleFitView = () => graphRef.current?.zoomToFit(400, 50);

    // ── Node rendering ──
    const paintNode = useCallback((node, ctx, globalScale) => {
        const isHighlighted = highlightNodes.size === 0 || highlightNodes.has(node.id);
        const isSelected = selectedNode?.id === node.id;
        const baseSize = 4 + (node.claim_count || 0) * 1.5;
        const size = isSelected ? baseSize + 3 : baseSize;

        // Node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
        ctx.fillStyle = isHighlighted
            ? getConfidenceColor(node.confidence)
            : 'rgba(100, 100, 100, 0.3)';
        ctx.fill();

        // Selected ring
        if (isSelected) {
            ctx.strokeStyle = '#A076F9';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Label
        const label = node.name;
        const fontSize = Math.max(10 / globalScale, 3);
        ctx.font = `${fontSize}px Sans-Serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isHighlighted ? '#ffffff' : 'rgba(150, 150, 150, 0.5)';
        ctx.fillText(label, node.x, node.y + size + fontSize + 1);
    }, [highlightNodes, selectedNode]);

    // ── Link rendering ──
    const paintLink = useCallback((link, ctx) => {
        const isPrereq = link.type === 'PREREQ';
        ctx.strokeStyle = isPrereq
            ? 'rgba(160, 118, 249, 0.5)'   // Purple for PREREQ
            : 'rgba(100, 100, 100, 0.3)';  // Gray for RELATED

        ctx.lineWidth = isPrereq ? 1.5 : 0.8;

        // Dashed line for RELATED
        if (!isPrereq) ctx.setLineDash([4, 4]);
        else ctx.setLineDash([]);

        ctx.beginPath();
        ctx.moveTo(link.source.x, link.source.y);
        ctx.lineTo(link.target.x, link.target.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Arrow for PREREQ
        if (isPrereq) {
            const dx = link.target.x - link.source.x;
            const dy = link.target.y - link.source.y;
            const angle = Math.atan2(dy, dx);
            const arrowLen = 6;
            const targetSize = 4 + (link.target.claim_count || 0) * 1.5;
            const endX = link.target.x - Math.cos(angle) * (targetSize + 2);
            const endY = link.target.y - Math.sin(angle) * (targetSize + 2);

            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(
                endX - arrowLen * Math.cos(angle - Math.PI / 6),
                endY - arrowLen * Math.sin(angle - Math.PI / 6)
            );
            ctx.lineTo(
                endX - arrowLen * Math.cos(angle + Math.PI / 6),
                endY - arrowLen * Math.sin(angle + Math.PI / 6)
            );
            ctx.closePath();
            ctx.fillStyle = 'rgba(160, 118, 249, 0.7)';
            ctx.fill();
        }
    }, []);

    // ── Stats from graph data ──
    const totalNodes = graphData?.nodes?.length || 0;
    const totalLinks = graphData?.links?.length || 0;
    const prereqCount = graphData?.links?.filter(l => l.type === 'PREREQ').length || 0;

    // ── Loading State ──
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
                <Loader2 size={40} className="text-accent animate-spin" />
                <p className="text-gray-400">Loading your knowledge graph...</p>
            </div>
        );
    }

    // ── Error State ──
    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
                <AlertCircle size={48} className="text-red-400" />
                <p className="text-red-400">Failed to load graph data.</p>
                <p className="text-gray-500 text-sm">{error?.response?.data?.detail || error?.message}</p>
            </div>
        );
    }

    // ── Empty State ──
    if (totalNodes === 0) {
        return (
            <div className="max-w-6xl mx-auto p-4 sm:p-8 animate-fade-in">
                <div className="bg-surface-card border border-border rounded-xl p-8 sm:p-12 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6">
                        <Share2 size={32} className="text-purple-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">No knowledge graph yet</h2>
                    <p className="text-gray-400 max-w-md mb-6">
                        Upload PDFs or create notes in your Vault. MindForge will automatically extract topics 
                        and build connections between them to create your knowledge graph.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-6 pb-2">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 flex items-center gap-2">
                        <Share2 size={28} className="text-purple-400" />
                        Knowledge Graph
                    </h1>
                    <p className="text-gray-400">
                        {totalNodes} topics · {prereqCount} prerequisites · {totalLinks - prereqCount} related
                    </p>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-2">
                    <button onClick={handleZoomIn}
                        className="p-2 bg-surface-card border border-border rounded-lg hover:border-accent/30 transition-colors text-gray-400 hover:text-white"
                        title="Zoom In">
                        <ZoomIn size={18} />
                    </button>
                    <button onClick={handleZoomOut}
                        className="p-2 bg-surface-card border border-border rounded-lg hover:border-accent/30 transition-colors text-gray-400 hover:text-white"
                        title="Zoom Out">
                        <ZoomOut size={18} />
                    </button>
                    <button onClick={handleFitView}
                        className="p-2 bg-surface-card border border-border rounded-lg hover:border-accent/30 transition-colors text-gray-400 hover:text-white"
                        title="Fit to View">
                        <Maximize2 size={18} />
                    </button>
                </div>
            </div>

            {/* Graph + Side Panel */}
            <div className="flex-1 flex relative overflow-hidden">
                {/* Graph Canvas */}
                <div ref={containerRef} className={`flex-1 transition-all duration-300 ${selectedNode ? 'mr-0 sm:mr-96' : ''}`}>
                    <React.Suspense fallback={
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="animate-spin text-accent" size={32} />
                        </div>
                    }>
                        <ForceGraph2D
                            ref={graphRef}
                            graphData={graphData}
                            width={selectedNode ? Math.max(dimensions.width - 384, 300) : dimensions.width}
                            height={dimensions.height - 80}
                            nodeCanvasObject={paintNode}
                            linkCanvasObject={paintLink}
                            onNodeClick={handleNodeClick}
                            nodeLabel={(node) => 
                                `${node.name}\nConfidence: ${node.confidence}%\nReviews: ${node.review_count}\nClaims: ${node.claim_count}`
                            }
                            linkLabel={(link) => link.reason || `${link.type} connection`}
                            backgroundColor="#0a0a0a"
                            cooldownTicks={100}
                            nodeRelSize={6}
                            linkDirectionalArrowLength={0}
                            enableNodeDrag={true}
                        />
                    </React.Suspense>
                </div>

                {/* Side Panel (slides in when a node is clicked) */}
                {selectedNode && (
                    <div className="absolute right-0 top-0 bottom-0 w-full sm:w-96 bg-gray-950 border-l border-border overflow-y-auto z-10 animate-slide-in-right">
                        {/* Panel Header */}
                        <div className="sticky top-0 bg-gray-950 border-b border-border p-4 flex items-center justify-between z-10">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-3 h-3 rounded-full shrink-0"
                                    style={{ backgroundColor: getConfidenceColor(selectedNode.confidence) }}
                                />
                                <h2 className="text-lg font-bold text-white truncate">{selectedNode.name}</h2>
                            </div>
                            <button onClick={closeSidePanel}
                                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg shrink-0">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-4 space-y-6">
                            {/* Mastery Stats */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Mastery</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-surface-card p-3 rounded-lg border border-border">
                                        <p className="text-xs text-gray-500">Confidence</p>
                                        <p className="text-lg font-bold" style={{ color: getConfidenceColor(selectedNode.confidence) }}>
                                            {selectedNode.confidence}%
                                        </p>
                                    </div>
                                    <div className="bg-surface-card p-3 rounded-lg border border-border">
                                        <p className="text-xs text-gray-500">Accuracy</p>
                                        <p className="text-lg font-bold text-white">{selectedNode.accuracy}%</p>
                                    </div>
                                    <div className="bg-surface-card p-3 rounded-lg border border-border">
                                        <p className="text-xs text-gray-500">Reviews</p>
                                        <p className="text-lg font-bold text-white">{selectedNode.review_count}</p>
                                    </div>
                                    <div className="bg-surface-card p-3 rounded-lg border border-border">
                                        <p className="text-xs text-gray-500">Streak</p>
                                        <p className="text-lg font-bold text-white">{selectedNode.consecutive_correct}</p>
                                    </div>
                                </div>

                                {/* Confidence Bar */}
                                <div className="mt-3 w-full bg-gray-800 rounded-full h-2">
                                    <div className="h-2 rounded-full transition-all duration-500"
                                        style={{
                                            width: `${selectedNode.confidence}%`,
                                            backgroundColor: getConfidenceColor(selectedNode.confidence),
                                        }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {getConfidenceLabel(selectedNode.confidence)} · Next review: {selectedNode.next_review}
                                </p>
                            </div>

                            {/* Gap Analysis Button */}
                            <button
                                onClick={() => handleGapAnalysis(selectedNode.id)}
                                disabled={gapLoading}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent/10 hover:bg-accent/20 text-accent border border-accent/20 rounded-xl font-medium transition-colors disabled:opacity-50"
                            >
                                {gapLoading ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <Target size={18} />
                                )}
                                Analyze Prerequisites
                            </button>

                            {/* Gap Analysis Results */}
                            {gapResult && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                                        Prerequisite Analysis
                                    </h3>

                                    {gapResult.total_prerequisites === 0 ? (
                                        <div className="bg-surface-card p-4 rounded-lg border border-border text-center">
                                            <CheckCircle size={24} className="text-emerald-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-400">No prerequisites found. This is a foundational topic!</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Missing */}
                                            {gapResult.missing?.length > 0 && (
                                                <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                                                    <p className="text-xs font-medium text-red-400 mb-2 flex items-center gap-1.5">
                                                        <AlertCircle size={14} />
                                                        Missing ({gapResult.missing.length})
                                                    </p>
                                                    {gapResult.missing.map(t => (
                                                        <div key={t.id} className="flex items-center justify-between py-1.5">
                                                            <span className="text-sm text-white">{t.name}</span>
                                                            <span className="text-xs text-red-400">Never reviewed</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Weak */}
                                            {gapResult.weak?.length > 0 && (
                                                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
                                                    <p className="text-xs font-medium text-yellow-400 mb-2 flex items-center gap-1.5">
                                                        <AlertTriangle size={14} />
                                                        Weak ({gapResult.weak.length})
                                                    </p>
                                                    {gapResult.weak.map(t => (
                                                        <div key={t.id} className="flex items-center justify-between py-1.5">
                                                            <span className="text-sm text-white">{t.name}</span>
                                                            <span className="text-xs text-yellow-400">{t.confidence}%</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Ready */}
                                            {gapResult.ready?.length > 0 && (
                                                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
                                                    <p className="text-xs font-medium text-emerald-400 mb-2 flex items-center gap-1.5">
                                                        <CheckCircle size={14} />
                                                        Ready ({gapResult.ready.length})
                                                    </p>
                                                    {gapResult.ready.map(t => (
                                                        <div key={t.id} className="flex items-center justify-between py-1.5">
                                                            <span className="text-sm text-white">{t.name}</span>
                                                            <span className="text-xs text-emerald-400">{t.confidence}%</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Learning Path */}
                                            {gapResult.path?.length > 1 && (
                                                <div className="bg-surface-card border border-border rounded-lg p-3">
                                                    <p className="text-xs font-medium text-gray-400 mb-2">Suggested Learning Path</p>
                                                    <div className="flex flex-wrap items-center gap-1">
                                                        {gapResult.path.map((name, i) => (
                                                            <React.Fragment key={i}>
                                                                <span className="text-xs px-2 py-1 bg-gray-800 text-gray-300 rounded-md">{name}</span>
                                                                {i < gapResult.path.length - 1 && (
                                                                    <ArrowRight size={12} className="text-gray-600" />
                                                                )}
                                                            </React.Fragment>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Claims */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                                    <BookOpen size={14} />
                                    Claims & Evidence ({claims.length})
                                </h3>

                                {claimsLoading ? (
                                    <div className="space-y-3">
                                        {[1, 2].map(i => (
                                            <div key={i} className="bg-surface-card p-4 rounded-lg border border-border animate-pulse">
                                                <div className="h-4 w-3/4 bg-gray-800 rounded mb-3"></div>
                                                <div className="h-3 w-full bg-gray-800 rounded mb-2"></div>
                                                <div className="h-3 w-1/2 bg-gray-800 rounded"></div>
                                            </div>
                                        ))}
                                    </div>
                                ) : claims.length === 0 ? (
                                    <div className="bg-surface-card p-4 rounded-lg border border-border text-center">
                                        <p className="text-sm text-gray-500">No claims extracted yet for this topic.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {claims.map((claim) => (
                                            <div key={claim.id} className="bg-surface-card p-4 rounded-lg border border-border">
                                                <p className="text-sm text-white mb-2">{claim.claim_text}</p>
                                                <blockquote className="text-xs text-gray-400 italic border-l-2 border-accent/30 pl-3">
                                                    "{claim.evidence_text}"
                                                </blockquote>
                                                <p className="text-xs text-gray-600 mt-2">
                                                    Source: {claim.source_title} ({claim.source_type})
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
