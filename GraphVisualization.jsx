import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GraphVisualization({ graphData, onNodeHover }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [nodePositions, setNodePositions] = useState(new Map());
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  // Force-directed layout simulation
  const calculateLayout = useCallback(() => {
    if (!graphData?.nodes?.length) return new Map();

    const positions = new Map();
    const width = 800;
    const height = 600;
    
    // Initialize positions
    graphData.nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / graphData.nodes.length;
      const radius = Math.min(width, height) * 0.35;
      positions.set(node.id, {
        x: width / 2 + radius * Math.cos(angle),
        y: height / 2 + radius * Math.sin(angle),
        vx: 0,
        vy: 0
      });
    });

    // Run force simulation
    const iterations = 100;
    const repulsionForce = 5000;
    const attractionForce = 0.01;
    const damping = 0.9;

    for (let iter = 0; iter < iterations; iter++) {
      // Apply repulsion between all nodes
      graphData.nodes.forEach((nodeA) => {
        const posA = positions.get(nodeA.id);
        graphData.nodes.forEach((nodeB) => {
          if (nodeA.id === nodeB.id) return;
          const posB = positions.get(nodeB.id);
          
          const dx = posA.x - posB.x;
          const dy = posA.y - posB.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          
          const force = repulsionForce / (dist * dist);
          posA.vx += (dx / dist) * force;
          posA.vy += (dy / dist) * force;
        });
      });

      // Apply attraction along edges
      graphData.edges.forEach((edge) => {
        const posA = positions.get(edge.source);
        const posB = positions.get(edge.target);
        if (!posA || !posB) return;

        const dx = posB.x - posA.x;
        const dy = posB.y - posA.y;
        
        posA.vx += dx * attractionForce;
        posA.vy += dy * attractionForce;
        posB.vx -= dx * attractionForce;
        posB.vy -= dy * attractionForce;
      });

      // Update positions
      positions.forEach((pos) => {
        pos.x += pos.vx;
        pos.y += pos.vy;
        pos.vx *= damping;
        pos.vy *= damping;
        
        // Keep within bounds
        pos.x = Math.max(50, Math.min(width - 50, pos.x));
        pos.y = Math.max(50, Math.min(height - 50, pos.y));
      });
    }

    return positions;
  }, [graphData]);

  useEffect(() => {
    if (graphData?.nodes?.length) {
      const positions = calculateLayout();
      setNodePositions(positions);
    }
  }, [graphData, calculateLayout]);

  // Draw graph
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !graphData?.nodes?.length || nodePositions.size === 0) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    // Clear canvas
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, width, height);

    // Apply transform
    ctx.save();
    ctx.translate(width / 2 + transform.x, height / 2 + transform.y);
    ctx.scale(transform.scale, transform.scale);
    ctx.translate(-400, -300);

    // Draw edges
    graphData.edges.forEach((edge) => {
      const source = nodePositions.get(edge.source);
      const target = nodePositions.get(edge.target);
      if (!source || !target) return;

      const sourceNode = graphData.nodes.find(n => n.id === edge.source);
      const targetNode = graphData.nodes.find(n => n.id === edge.target);
      
      // Edge color based on suspicious nodes
      let edgeColor = 'rgba(100, 116, 139, 0.3)';
      if (sourceNode?.suspicious && targetNode?.suspicious) {
        edgeColor = 'rgba(239, 68, 68, 0.5)';
      } else if (sourceNode?.suspicious || targetNode?.suspicious) {
        edgeColor = 'rgba(251, 146, 60, 0.4)';
      }

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.strokeStyle = edgeColor;
      ctx.lineWidth = Math.min(3, edge.transaction_count * 0.5);
      ctx.stroke();

      // Draw arrow
      const angle = Math.atan2(target.y - source.y, target.x - source.x);
      const nodeRadius = targetNode?.size || 10;
      const arrowX = target.x - Math.cos(angle) * (nodeRadius + 5);
      const arrowY = target.y - Math.sin(angle) * (nodeRadius + 5);
      
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(
        arrowX - 8 * Math.cos(angle - Math.PI / 6),
        arrowY - 8 * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        arrowX - 8 * Math.cos(angle + Math.PI / 6),
        arrowY - 8 * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = edgeColor.replace('0.3', '0.6').replace('0.4', '0.7').replace('0.5', '0.8');
      ctx.fill();
    });

    // Draw nodes
    graphData.nodes.forEach((node) => {
      const pos = nodePositions.get(node.id);
      if (!pos) return;

      const isHovered = hoveredNode === node.id;
      const radius = node.size * (isHovered ? 1.3 : 1);

      // Glow effect for suspicious nodes
      if (node.suspicious) {
        const gradient = ctx.createRadialGradient(
          pos.x, pos.y, 0,
          pos.x, pos.y, radius * 2
        );
        gradient.addColorStop(0, `${node.color}40`);
        gradient.addColorStop(1, 'transparent');
        
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius * 2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.fill();

      // Border
      ctx.strokeStyle = node.suspicious ? '#FFFFFF' : '#334155';
      ctx.lineWidth = node.suspicious ? 2 : 1;
      ctx.stroke();

      // Label for suspicious nodes or hovered
      if (node.suspicious || isHovered) {
        ctx.font = '10px Inter, system-ui, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText(node.id, pos.x, pos.y + radius + 14);
      }
    });

    ctx.restore();
  }, [graphData, nodePositions, transform, hoveredNode]);

  // Handle mouse events
  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDragging.current) {
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      setTransform(prev => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy
      }));
      lastMouse.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Check if hovering over a node
    const canvasX = (x - rect.width / 2 - transform.x) / transform.scale + 400;
    const canvasY = (y - rect.height / 2 - transform.y) / transform.scale + 300;

    let hovered = null;
    for (const node of graphData?.nodes || []) {
      const pos = nodePositions.get(node.id);
      if (!pos) continue;
      
      const dist = Math.sqrt((pos.x - canvasX) ** 2 + (pos.y - canvasY) ** 2);
      if (dist < node.size * 1.5) {
        hovered = node.id;
        break;
      }
    }

    setHoveredNode(hovered);
    if (onNodeHover) {
      const nodeData = graphData?.nodes?.find(n => n.id === hovered);
      onNodeHover(nodeData);
    }
  };

  const handleMouseDown = (e) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.1, Math.min(5, prev.scale * scaleFactor))
    }));
  };

  const resetView = () => {
    setTransform({ x: 0, y: 0, scale: 1 });
  };

  if (!graphData?.nodes?.length) {
    return (
      <div className="w-full h-[500px] rounded-2xl bg-slate-900/50 flex items-center justify-center">
        <p className="text-slate-500">No graph data to display</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <canvas
        ref={canvasRef}
        className="w-full h-[500px] rounded-2xl cursor-grab active:cursor-grabbing"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
      
      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <button
          onClick={resetView}
          className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-sm rounded-lg backdrop-blur-sm transition-colors"
        >
          Reset View
        </button>
        <button
          onClick={() => setTransform(p => ({ ...p, scale: p.scale * 1.2 }))}
          className="w-8 h-8 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg backdrop-blur-sm transition-colors flex items-center justify-center"
        >
          +
        </button>
        <button
          onClick={() => setTransform(p => ({ ...p, scale: p.scale * 0.8 }))}
          className="w-8 h-8 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg backdrop-blur-sm transition-colors flex items-center justify-center"
        >
          −
        </button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Legend</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 ring-2 ring-white/50" />
            <span className="text-xs text-slate-300">Suspicious Account</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-500" />
            <span className="text-xs text-slate-300">Normal Account</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-red-500/50" />
            <span className="text-xs text-slate-300">Suspicious Link</span>
          </div>
        </div>
      </div>
    </div>
  );
}