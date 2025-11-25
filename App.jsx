import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';

// -----------------------------------------------------------
// 2. D3 Radar Chart Component with Transitions
// -----------------------------------------------------------
const RadarChart = ({ data, width = 500, height = 400 }) => {
    const svgRef = useRef();

    useEffect(() => {
        if (!data || data.length === 0) return;

        const svg = d3.select(svgRef.current);

        const margin = 60;
        const radius = Math.min(width, height) / 2 - margin;
        const axes = data[0].stats.map(d => d.axis);
        const angleSlice = (Math.PI * 2) / axes.length;

        // Scale
        const rScale = d3.scaleLinear().range([0, radius]).domain([0, 100]);

        // Container (Create once)
        let g = svg.select(".radar-container");
        if (g.empty()) {
            svg.selectAll("*").remove();
            g = svg.append("g")
                .attr("class", "radar-container")
                .attr("transform", `translate(${width / 2},${height / 2})`);

            // Draw Grid & Axes (Static)
            const levels = 5;
            for (let level = 0; level <= levels; level++) {
                const r = (radius / levels) * level;
                g.append("circle")
                    .attr("r", r)
                    .style("fill", "none")
                    .style("stroke", "#334155")
                    .style("stroke-dasharray", "4,4")
                    .style("stroke-width", "1px");
            }

            const axisGrid = g.selectAll(".axis")
                .data(axes)
                .enter()
                .append("g")
                .attr("class", "axis");

            axisGrid.append("line")
                .attr("x1", 0)
                .attr("y1", 0)
                .attr("x2", (d, i) => rScale(100) * Math.cos(angleSlice * i - Math.PI / 2))
                .attr("y2", (d, i) => rScale(100) * Math.sin(angleSlice * i - Math.PI / 2))
                .attr("class", "line")
                .style("stroke", "#475569")
                .style("stroke-width", "1px");

            axisGrid.append("text")
                .attr("class", "legend")
                .style("font-size", "12px")
                .attr("text-anchor", "middle")
                .attr("dy", "0.35em")
                .attr("x", (d, i) => rScale(115) * Math.cos(angleSlice * i - Math.PI / 2))
                .attr("y", (d, i) => rScale(115) * Math.sin(angleSlice * i - Math.PI / 2))
                .text(d => d)
                .style("fill", "#94a3b8")
                .style("font-weight", "600");
        }

        // Draw Radar Areas (Dynamic)
        const radarLine = d3.lineRadial()
            .curve(d3.curveLinearClosed)
            .radius(d => rScale(d.value))
            .angle((d, i) => i * angleSlice);

        const colors = ["#f97316", "#10b981", "#3b82f6"]; // Orange, Emerald, Blue

        // Data Join for Areas
        const paths = g.selectAll(".radar-area")
            .data(data, d => d.id);

        paths.exit()
            .transition().duration(500)
            .style("opacity", 0)
            .remove();

        paths.enter()
            .append("path")
            .attr("class", "radar-area")
            .attr("d", d => radarLine(d.stats.map(s => ({ ...s, value: 0 })))) // Start from center
            .style("fill", (d, i) => colors[i % colors.length])
            .style("fill-opacity", 0.2)
            .style("stroke", (d, i) => colors[i % colors.length])
            .style("stroke-width", 3)
            .merge(paths) // Update both new and existing
            .transition().duration(750)
            .attr("d", d => radarLine(d.stats))
            .style("fill", (d, i) => colors[i % colors.length])
            .style("stroke", (d, i) => colors[i % colors.length])
            .style("filter", (d, i) => "drop-shadow(0 0 8px " + colors[i % colors.length] + "40)");

        // Data Join for Dots (Grouped by District)
        const dotGroups = g.selectAll(".dot-group")
            .data(data, d => d.id);

        dotGroups.exit().remove();

        const dotGroupsEnter = dotGroups.enter()
            .append("g")
            .attr("class", "dot-group");

        const allDotGroups = dotGroupsEnter.merge(dotGroups);

        const dots = allDotGroups.selectAll(".dot")
            .data(d => d.stats.map(s => ({ ...s, parentIdx: data.indexOf(d) })));

        dots.exit().remove();

        dots.enter()
            .append("circle")
            .attr("class", "dot")
            .attr("r", 5)
            .style("fill", "#1e293b")
            .style("stroke-width", 2)
            .merge(dots)
            .transition().duration(750)
            .attr("cx", (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
            .attr("cy", (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
            .style("stroke", d => colors[d.parentIdx % colors.length]);


    }, [data, width, height]);

    return <svg ref={svgRef} width={width} height={height} style={{ overflow: "visible" }} />;
};

// -----------------------------------------------------------
// 3. Info Tooltip
// -----------------------------------------------------------
const InfoTooltip = ({ metricKey }) => {
    const tooltips = {
        sales: { title: "매출력 (Sales Power)", desc: "Total monthly revenue based on card data.", formula: "Sum of monthly sales" },
        survival: { title: "생존력 (Survival Rate)", desc: "Percentage of stores operating for >1 year.", formula: "100 - Closure Rate" },
        efficiency: { title: "효율성 (Efficiency)", desc: "Average revenue per store.", formula: "Total Sales / Number of Stores" },
        saturation: { title: "포화도 (Saturation)", desc: "Number of competing stores in the district.", formula: "Count of Stores" },
        weekend: { title: "주말바이브 (Weekend Vibe)", desc: "Percentage of sales occurring on weekends.", formula: "(Weekend Sales / Total Sales) * 100" },
        age: { title: "연령대 (Age Group)", desc: "Revenue distribution by age group.", formula: "Sales by Age / Total Sales" },
        time: { title: "시간대 (Time Slot)", desc: "Revenue distribution by time of day.", formula: "Sales by Time / Total Sales" },
        day: { title: "요일 (Day of Week)", desc: "Revenue distribution by day of week.", formula: "Sales by Day / Total Sales" }
    };
    const info = tooltips[metricKey] || { title: "Metric", desc: "Metric info", formula: "" };
    return (
        <span className="info-tooltip-container">
            ℹ️
            <div className="tooltip-content">
                <strong>{info.title}</strong>
                <p>{info.desc}</p>
                <div className="formula">🧮 {info.formula}</div>
            </div>
        </span>
    );
};

// -----------------------------------------------------------
// 4. Customer DNA Chart (Grouped Bar)
// -----------------------------------------------------------
const CustomerDNAChart = ({ data, colors }) => {
    const width = 400;
    const height = 200;
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartW = width - margin.left - margin.right;
    const chartH = height - margin.top - margin.bottom;

    const ageGroups = ["10s", "20s", "30s", "40s", "50s", "60s+"];

    // Prepare data
    // Expect data[i].deepDive.age = { "10s": val, ... }

    const x0 = d3.scaleBand().domain(ageGroups).range([0, chartW]).padding(0.2);
    const x1 = d3.scaleBand().domain(data.map(d => d.name)).range([0, x0.bandwidth()]).padding(0.05);
    const y = d3.scaleLinear().domain([0, 100]).range([chartH, 0]); // Percentages

    return (
        <div className="chart-item">
            <h4>👥 Customer DNA (Age Demographics) <InfoTooltip metricKey="age" /></h4>
            <svg width={width} height={height}>
                <g transform={`translate(${margin.left}, ${margin.top})`}>
                    <line x1={0} y1={chartH} x2={chartW} y2={chartH} stroke="#475569" />
                    <line x1={0} y1={0} x2={0} y2={chartH} stroke="#475569" />

                    {ageGroups.map(age => (
                        <g key={age} transform={`translate(${x0(age)}, 0)`}>
                            {data.map((d, i) => (
                                <rect
                                    key={d.id}
                                    x={x1(d.name)}
                                    y={y(d.deepDive?.age[age] || 0)}
                                    width={x1.bandwidth()}
                                    height={chartH - y(d.deepDive?.age[age] || 0)}
                                    fill={colors[i % colors.length]}
                                />
                            ))}
                        </g>
                    ))}

                    {ageGroups.map(age => (
                        <text key={age} x={x0(age) + x0.bandwidth() / 2} y={chartH + 15} textAnchor="middle" fill="#94a3b8" fontSize="10">{age}</text>
                    ))}
                </g>
            </svg>
        </div>
    );
};

// -----------------------------------------------------------
// 5. Time Heatmap Chart (Line + Bar)
// -----------------------------------------------------------
const TimeHeatmapChart = ({ data, colors }) => {
    const width = 400;
    const height = 200;
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartW = width - margin.left - margin.right;
    const chartH = height - margin.top - margin.bottom;

    const times = ["00-06", "06-11", "11-14", "14-17", "17-21", "21-24"];

    const x = d3.scalePoint().domain(times).range([0, chartW]).padding(0.5);
    const y = d3.scaleLinear().domain([0, 50]).range([chartH, 0]); // Max 50% for time share

    const line = d3.line()
        .x(d => x(d.time))
        .y(d => y(d.value))
        .curve(d3.curveMonotoneX);

    return (
        <div className="chart-item">
            <h4>⏰ Golden Hour (Time of Day) <InfoTooltip metricKey="time" /></h4>
            <svg width={width} height={height}>
                <g transform={`translate(${margin.left}, ${margin.top})`}>
                    <line x1={0} y1={chartH} x2={chartW} y2={chartH} stroke="#475569" />
                    <line x1={0} y1={0} x2={0} y2={chartH} stroke="#475569" />

                    {data.map((d, i) => {
                        const lineData = times.map(t => ({ time: t, value: d.deepDive?.time[t] || 0 }));
                        return (
                            <path
                                key={d.id}
                                d={line(lineData)}
                                fill="none"
                                stroke={colors[i % colors.length]}
                                strokeWidth="2"
                            />
                        );
                    })}

                    {times.map((t, i) => (
                        <text key={t} x={x(t)} y={chartH + 15} textAnchor="middle" fill="#94a3b8" fontSize="10">{t}</text>
                    ))}
                </g>
            </svg>
        </div>
    );
};
// -----------------------------------------------------------
// 5.5 Vinyl Groove Chart (Analytical Mixer)
// -----------------------------------------------------------
const VinylMixerPanel = ({ filters, setFilters, metrics, setMetrics, isPlaying, togglePlay, playbackInfo }) => {
    const ageGroups = ["10s", "20s", "30s", "40s", "50s", "60s+"];

    return (
        <div className="vinyl-mixer-panel" style={{
            background: '#1e293b',
            padding: '1rem',
            borderRadius: '12px',
            border: '1px solid #334155',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            width: '100%'
        }}>
            <div className="mixer-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, color: '#f8fafc' }}>🎛️ Groove Mixer</h4>
                <div className={`status-light ${isPlaying ? 'on' : ''}`} style={{
                    width: '10px', height: '10px', borderRadius: '50%',
                    background: isPlaying ? '#22c55e' : '#ef4444',
                    boxShadow: isPlaying ? '0 0 8px #22c55e' : 'none'
                }}></div>
            </div>

            {/* Demographic EQ */}
            <div className="mixer-section">
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>👥 Demographic EQ</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {ageGroups.map(age => (
                        <button
                            key={age}
                            onClick={() => {
                                const newAges = filters.ages.includes(age)
                                    ? filters.ages.filter(a => a !== age)
                                    : [...filters.ages, age];
                                setFilters({ ...filters, ages: newAges });
                            }}
                            style={{
                                fontSize: '0.75rem',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                border: '1px solid #475569',
                                background: filters.ages.includes(age) ? '#3b82f6' : 'transparent',
                                color: filters.ages.includes(age) ? 'white' : '#94a3b8',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {age}
                        </button>
                    ))}
                </div>
            </div>

            {/* Metric Switcher */}
            <div className="mixer-section">
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>📊 Signal Source</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['sales', 'traffic'].map(m => (
                        <button
                            key={m}
                            onClick={() => setMetrics(m)}
                            style={{
                                flex: 1,
                                fontSize: '0.75rem',
                                padding: '0.25rem',
                                borderRadius: '4px',
                                border: '1px solid #475569',
                                background: metrics === m ? '#f59e0b' : 'transparent',
                                color: metrics === m ? 'white' : '#94a3b8',
                                cursor: 'pointer'
                            }}
                        >
                            {m === 'sales' ? '💰 Volume' : '👣 Traffic'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Comparison Toggle */}
            <div className="mixer-section">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', color: '#cbd5e1' }}>
                    <input
                        type="checkbox"
                        checked={filters.showAverage}
                        onChange={(e) => setFilters({ ...filters, showAverage: e.target.checked })}
                    />
                    Show Seoul Average (Ghost Track)
                </label>
            </div>

            {/* Transport Controls */}
            <div className="transport-controls" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: 'auto' }}>
                <button
                    onClick={togglePlay}
                    style={{
                        background: isPlaying ? '#ef4444' : '#22c55e',
                        border: 'none',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                        color: 'white',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                    }}
                >
                    {isPlaying ? '⏹️' : '▶️'}
                </button>
                <div className="monitor-display" style={{
                    flex: 1,
                    background: '#0f172a',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    color: '#22c55e'
                }}>
                    <div>{playbackInfo.day || '--'} {playbackInfo.time || '--:--'}</div>
                    <div style={{ color: '#f8fafc' }}>
                        {playbackInfo.value ? `₩ ${(playbackInfo.value / 10000).toFixed(1)}만` : 'Ready'}
                    </div>
                </div>
            </div>
        </div>
    );
};

const VinylGrooveChart = ({ data, averageData }) => {
    const svgRef = useRef();
    const [isPlaying, setIsPlaying] = useState(false);
    const audioCtxRef = useRef(null);
    const oscillatorRef = useRef(null);
    const gainNodeRef = useRef(null);
    const animationRef = useRef(null);
    const [playbackIndex, setPlaybackIndex] = useState(0);

    // Mixer State
    const [filters, setFilters] = useState({
        ages: ["10s", "20s", "30s", "40s", "50s", "60s+"],
        showAverage: false
    });
    const [metrics, setMetrics] = useState('sales');

    // Process Data with Filters
    const processVinylData = (district, isGhost = false) => {
        if (!district || !district.deepDive) return [];

        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const times = ["00-06", "06-11", "11-14", "14-17", "17-21", "21-24"];

        // 1. Calculate Total Weight based on Active Filters
        // If all ages selected, weight is 1.0. If only "20s", weight is ratio of 20s sales.
        let filterWeight = 1.0;
        if (!isGhost && district.deepDive.age) {
            const totalAgeSales = Object.values(district.deepDive.age).reduce((a, b) => a + b, 0);
            const activeAgeSales = filters.ages.reduce((sum, age) => sum + (district.deepDive.age[age] || 0), 0);
            filterWeight = totalAgeSales > 0 ? activeAgeSales / totalAgeSales : 0;
        }

        const dayDist = district.deepDive.day;
        const timeDist = district.deepDive.time;

        let points = [];
        let maxVal = 0;

        days.forEach((day, dIdx) => {
            times.forEach((time, tIdx) => {
                // Base Value (Sales or Traffic proxy)
                let val = (dayDist[day] || 0) * (timeDist[time] || 0);

                // Apply Filter Weight
                val *= filterWeight;

                if (val > maxVal) maxVal = val;
                points.push({
                    id: `${day}-${time}`,
                    dayIndex: dIdx,
                    timeIndex: tIdx,
                    value: val, // Raw relative value
                    rawDay: day,
                    rawTime: time
                });
            });
        });

        // Normalize globally (across all potential values to keep relative scale)
        // For ghost track, we normalize against its own max to show shape comparison
        return points.map(p => ({ ...p, norm: maxVal > 0 ? p.value / maxVal : 0 }));
    };

    const vinylData = useMemo(() => processVinylData(data), [data, filters, metrics]);
    const ghostData = useMemo(() => filters.showAverage && averageData ? processVinylData(averageData, true) : [], [averageData, filters.showAverage]);

    // Determine Genre Color based on Dominant Active Age
    const getGenreColor = () => {
        if (!data || !data.deepDive) return "#cbd5e1";
        const age = data.deepDive.age;

        // Calculate sums only for active filters
        const activeAges = filters.ages;
        const young = (activeAges.includes("10s") ? age["10s"] : 0) + (activeAges.includes("20s") ? age["20s"] : 0);
        const mid = (activeAges.includes("30s") ? age["30s"] : 0) + (activeAges.includes("40s") ? age["40s"] : 0);
        const old = (activeAges.includes("50s") ? age["50s"] : 0) + (activeAges.includes("60s+") ? age["60s+"] : 0);

        if (young > mid && young > old) return "#d946ef"; // Neon Fuchsia
        if (mid > young && mid > old) return "#0ea5e9"; // Sky Blue
        return "#eab308"; // Gold
    };

    const genreColor = getGenreColor();

    // D3 Drawing
    useEffect(() => {
        if (!vinylData.length) return;

        const width = 300;
        const height = 300;
        const center = { x: width / 2, y: height / 2 };
        const maxRadius = width / 2 - 20;
        const minRadius = 40;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const g = svg.append("g")
            .attr("transform", `translate(${center.x},${center.y})`);

        // Draw Vinyl Record Background
        g.append("circle")
            .attr("r", maxRadius + 10)
            .attr("fill", "#1e293b")
            .attr("stroke", "#0f172a")
            .attr("stroke-width", 4);

        // Groove Texture
        for (let i = minRadius; i < maxRadius; i += 3) {
            g.append("circle")
                .attr("r", i)
                .attr("fill", "none")
                .attr("stroke", "#334155")
                .attr("stroke-width", 0.5)
                .attr("opacity", 0.3);
        }

        // Spiral Generator
        const spiralLine = d3.lineRadial()
            .angle((d, i) => (i * Math.PI * 2) / 6)
            .radius((d, i) => {
                const dayOffset = Math.floor(i / 6) * ((maxRadius - minRadius) / 7);
                const wiggle = d.norm * 15;
                return minRadius + dayOffset + wiggle;
            })
            .curve(d3.curveCatmullRom);

        // Draw Ghost Track (Average)
        if (ghostData.length > 0) {
            g.append("path")
                .datum(ghostData)
                .attr("d", spiralLine)
                .attr("fill", "none")
                .attr("stroke", "#64748b") // Slate 500
                .attr("stroke-width", 1.5)
                .attr("stroke-dasharray", "2,2")
                .attr("opacity", 0.5)
                .attr("class", "ghost-path");
        }

        // Draw Active Groove Path
        g.append("path")
            .datum(vinylData)
            .attr("d", spiralLine)
            .attr("fill", "none")
            .attr("stroke", genreColor)
            .attr("stroke-width", 2)
            .attr("stroke-linecap", "round")
            .style("filter", `drop-shadow(0 0 4px ${genreColor})`)
            .attr("class", isPlaying ? "groove-path playing" : "groove-path");

        // Interactive Needle (Scrubbing)
        // We'll visualize the current playback point
        if (playbackIndex >= 0 && playbackIndex < vinylData.length) {
            const i = playbackIndex;
            const angle = (i * Math.PI * 2) / 6 - Math.PI / 2; // Adjust for rotation
            const dayOffset = Math.floor(i / 6) * ((maxRadius - minRadius) / 7);
            const r = minRadius + dayOffset + (vinylData[i].norm * 15);

            const cx = r * Math.cos(angle);
            const cy = r * Math.sin(angle);

            g.append("circle")
                .attr("cx", cx)
                .attr("cy", cy)
                .attr("r", 4)
                .attr("fill", "#fff")
                .attr("stroke", genreColor)
                .attr("stroke-width", 2)
                .style("filter", "drop-shadow(0 0 2px white)");
        }

        // Center Label
        g.append("circle")
            .attr("r", minRadius - 5)
            .attr("fill", genreColor)
            .attr("opacity", 0.8);

        g.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .text(data.name.substring(0, 3))
            .attr("font-size", "12px")
            .attr("fill", "#0f172a")
            .attr("font-weight", "bold");

    }, [vinylData, ghostData, genreColor, isPlaying, playbackIndex]);

    // Audio Engine
    const togglePlay = () => {
        if (isPlaying) stopAudio();
        else startAudio();
    };

    const startAudio = () => {
        if (!window.AudioContext) return;
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        audioCtxRef.current = ctx;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const baseFreq = genreColor === "#d946ef" ? 440 : (genreColor === "#0ea5e9" ? 330 : 220);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        oscillatorRef.current = osc;
        gainNodeRef.current = gain;
        setIsPlaying(true);

        let index = playbackIndex;
        const speed = 200;

        const loop = () => {
            if (index >= vinylData.length) index = 0;

            const point = vinylData[index];
            setPlaybackIndex(index);

            if (gainNodeRef.current && oscillatorRef.current) {
                const now = ctx.currentTime;
                gainNodeRef.current.gain.linearRampToValueAtTime(point.norm * 0.5, now + 0.1);
                oscillatorRef.current.frequency.linearRampToValueAtTime(baseFreq + (point.norm * 100), now + 0.1);
            }

            index++;
            animationRef.current = setTimeout(loop, speed);
        };
        loop();
    };

    const stopAudio = () => {
        if (oscillatorRef.current) {
            oscillatorRef.current.stop();
            oscillatorRef.current.disconnect();
        }
        if (gainNodeRef.current) gainNodeRef.current.disconnect();
        if (audioCtxRef.current) audioCtxRef.current.close();
        if (animationRef.current) clearTimeout(animationRef.current);

        setIsPlaying(false);
    };

    useEffect(() => {
        return () => stopAudio();
    }, []);

    // Prepare Playback Info for Mixer
    const currentPoint = vinylData[playbackIndex] || {};
    const playbackInfo = {
        day: currentPoint.rawDay,
        time: currentPoint.rawTime,
        value: currentPoint.value // This is relative value, but good enough for demo
    };

    return (
        <div className="vinyl-chart-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'start' }}>
            <div className={`vinyl-record ${isPlaying ? 'spinning' : ''}`} style={{ alignSelf: 'center' }}>
                <svg ref={svgRef} width={300} height={300} style={{ overflow: 'visible' }} />
            </div>

            <VinylMixerPanel
                filters={filters}
                setFilters={setFilters}
                metrics={metrics}
                setMetrics={setMetrics}
                isPlaying={isPlaying}
                togglePlay={togglePlay}
                playbackInfo={playbackInfo}
            />
        </div>
    );
};

// -----------------------------------------------------------
// 6. Comparison Panel Component (Multi-charts)
// -----------------------------------------------------------
const ComparisonPanel = ({ selectedDistricts, historyData, timeRange, averageData, averageHistory }) => {
    const [activeTab, setActiveTab] = useState('overview');

    if (!selectedDistricts || selectedDistricts.length === 0) {
        return <div className="comparison-panel empty">Select a district to compare</div>;
    }

    const colors = ["#f97316", "#10b981", "#3b82f6"]; // Orange, Emerald, Blue

    // Prepare data for charts (Always include Average)
    const districtsToRender = [...selectedDistricts];
    if (averageData) {
        districtsToRender.push({
            id: 'average',
            name: 'Seoul Avg',
            isAverage: true,
            stats: averageData.stats,
            deepDive: averageData.deepDive
        });
    }

    // Helper: Radar Chart Item
    const renderRadarChart = () => {
        return (
            <div className="chart-item" style={{ gridRow: "span 2" }}>
                <h4>Overall Balance</h4>
                <RadarChart data={districtsToRender.filter(d => !d.isAverage)} width={300} height={250} />
                <div className="legend-container" style={{ marginTop: '0.5rem', gap: '1rem', justifyContent: 'center' }}>
                    {districtsToRender.filter(d => !d.isAverage).map((d, idx) => (
                        <div key={d.id} className="legend-item" style={{ fontSize: '0.8rem', color: colors[idx % colors.length] }}>
                            <span className="dot" style={{ width: '8px', height: '8px', backgroundColor: colors[idx % colors.length] }}></span>
                            {d.name}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Helper: Multi-line Chart
    const renderLineChart = (metricKey, title) => {
        const width = 280;
        const height = 100; // Reduced height
        const margin = { top: 10, right: 10, bottom: 20, left: 35 };
        const chartW = width - margin.left - margin.right;
        const chartH = height - margin.top - margin.bottom;

        // Gather all data points for domain
        let allPoints = [];
        const series = districtsToRender.map((d, idx) => {
            let data = [];
            if (d.isAverage) {
                if (averageHistory && averageHistory.length > 0) {
                    data = averageHistory.sort((a, b) => a.yq - b.yq).slice(-timeRange);
                }
            } else {
                const history = historyData[d.id];
                if (history) {
                    data = history.sort((a, b) => a.yq - b.yq).slice(-timeRange);
                }
            }

            if (data.length > 0) {
                allPoints = allPoints.concat(data.map(h => h[metricKey]));
                return {
                    id: d.id,
                    data: data,
                    color: d.isAverage ? '#94a3b8' : colors[idx % colors.length],
                    isAverage: d.isAverage
                };
            }
            return null;
        }).filter(s => s !== null);

        if (series.length === 0) return <div className="no-data">No history data</div>;

        const xDomain = [0, timeRange - 1];
        const yDomain = d3.extent(allPoints);
        // Add some padding to Y
        const yPadding = (yDomain[1] - yDomain[0]) * 0.1;
        yDomain[0] = Math.max(0, yDomain[0] - yPadding);
        yDomain[1] += yPadding;

        const xScale = d3.scaleLinear().domain(xDomain).range([0, chartW]);
        const yScale = d3.scaleLinear().domain(yDomain).range([chartH, 0]);
        const line = d3.line()
            .x((d, i) => xScale(i))
            .y(d => yScale(d[metricKey]))
            .curve(d3.curveMonotoneX);

        return (
            <div className="chart-item">
                <h4>{title}</h4>
                <svg width={width} height={height}>
                    <g transform={`translate(${margin.left}, ${margin.top})`}>
                        {/* Axes */}
                        <line x1={0} y1={chartH} x2={chartW} y2={chartH} stroke="#475569" />
                        <line x1={0} y1={0} x2={0} y2={chartH} stroke="#475569" />

                        {/* Lines */}
                        {series.map(s => (
                            <path
                                key={s.id}
                                d={line(s.data)}
                                fill="none"
                                stroke={s.color}
                                strokeWidth={s.isAverage ? "2" : "2"}
                                strokeDasharray={s.isAverage ? "4,4" : "0"}
                            />
                        ))}

                        {/* Dots */}
                        {series.map(s => s.data.map((d, i) => (
                            <circle key={i} cx={xScale(i)} cy={yScale(d[metricKey])} r={s.isAverage ? 2 : 3} fill={s.color} />
                        )))}
                    </g>
                </svg>
            </div>
        );
    };

    // Helper: Grouped Bar Chart
    const renderBarChart = (metricIndex, title) => {
        const width = 280;
        const height = 100; // Reduced height
        const margin = { top: 10, right: 10, bottom: 20, left: 35 };
        const chartW = width - margin.left - margin.right;
        const chartH = height - margin.top - margin.bottom;

        const data = districtsToRender.map((d, idx) => ({
            name: d.name,
            value: d.stats[metricIndex].value, // Normalized 0-100
            raw: d.stats[metricIndex].raw,
            color: d.isAverage ? '#94a3b8' : colors[idx % colors.length]
        }));

        const xScale = d3.scaleBand().domain(data.map(d => d.name)).range([0, chartW]).padding(0.3);
        const yScale = d3.scaleLinear().domain([0, 100]).range([chartH, 0]);

        return (
            <div className="chart-item">
                <h4>{title}</h4>
                <svg width={width} height={height}>
                    <g transform={`translate(${margin.left}, ${margin.top})`}>
                        {/* Axes */}
                        <line x1={0} y1={chartH} x2={chartW} y2={chartH} stroke="#475569" />

                        {/* Bars */}
                        {data.map((d, i) => (
                            <rect
                                key={i}
                                x={xScale(d.name)}
                                y={yScale(d.value)}
                                width={xScale.bandwidth()}
                                height={chartH - yScale(d.value)}
                                fill={d.color}
                            />
                        ))}

                        {/* Labels */}
                        {data.map((d, i) => (
                            <text
                                key={i}
                                x={xScale(d.name) + xScale.bandwidth() / 2}
                                y={yScale(d.value) - 5}
                                textAnchor="middle"
                                fill="#cbd5e1"
                                fontSize="10"
                            >
                                {d.raw}
                            </text>
                        ))}
                    </g>
                </svg>
            </div>
        );
    };

    return (
        <div className="comparison-panel">
            <div className="tab-container">
                <button
                    className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    📊 Overview
                </button>
                <button
                    className={`tab-button ${activeTab === 'deep-dive' ? 'active' : ''}`}
                    onClick={() => setActiveTab('deep-dive')}
                >
                    🔍 Deep Dive
                </button>
                <button
                    className={`tab-button ${activeTab === 'vinyl' ? 'active' : ''}`}
                    onClick={() => setActiveTab('vinyl')}
                >
                    💿 Seoul Groove
                </button>
            </div>

            <div className="charts-grid">
                {activeTab === 'overview' && (
                    <>
                        {renderRadarChart()}
                        {renderLineChart('sales', <span className="chart-title">Sales Trend <InfoTooltip metricKey="sales" /></span>)}
                        {renderLineChart('survival', <span className="chart-title">Survival Trend <InfoTooltip metricKey="survival" /></span>)}
                        {renderBarChart(3, <span className="chart-title">Efficiency <InfoTooltip metricKey="efficiency" /></span>)}
                        {renderBarChart(2, <span className="chart-title">Saturation <InfoTooltip metricKey="saturation" /></span>)}
                        {renderBarChart(4, <span className="chart-title">Weekend Vibe <InfoTooltip metricKey="weekend" /></span>)}
                    </>
                )}
                {activeTab === 'deep-dive' && (
                    <>
                        <CustomerDNAChart data={selectedDistricts} colors={colors} />
                        <TimeHeatmapChart data={selectedDistricts} colors={colors} />
                    </>
                )}
                {activeTab === 'vinyl' && (
                    <>
                        {selectedDistricts.map((d, i) => (
                            <div key={d.id} className="chart-item" style={{ gridColumn: "span 2" }}>
                                <h4>{d.name} Groove Mixer</h4>
                                <VinylGrooveChart data={d} averageData={averageData} />
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
};

// -----------------------------------------------------------
// 7. Main Application Component
// -----------------------------------------------------------
const ChickenBattleArena = () => {
    const [seoulData, setSeoulData] = useState([]);
    const [historyData, setHistoryData] = useState({});
    const [averageData, setAverageData] = useState(null);
    const [averageHistory, setAverageHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);
    const [timeRange, setTimeRange] = useState(4); // Default 4 quarters

    // New State for Filters
    const [guList, setGuList] = useState([]);
    const [dongList, setDongList] = useState({});
    const [industryList, setIndustryList] = useState([]);
    const [selectedGu, setSelectedGu] = useState('All');
    const [selectedDong, setSelectedDong] = useState('All');
    const [selectedIndustry, setSelectedIndustry] = useState('All');
    const [minRevenue, setMinRevenue] = useState(0);

    // Data Refs for filtering
    const rawSalesDataRef = useRef([]);
    const rawClosureDataRef = useRef([]);

    // Gu Code Mapping
    const guCodeMap = {
        "11110": "종로구", "11140": "중구", "11170": "용산구", "11200": "성동구", "11215": "광진구",
        "11230": "동대문구", "11260": "중랑구", "11290": "성북구", "11305": "강북구", "11320": "도봉구",
        "11350": "노원구", "11380": "은평구", "11410": "서대문구", "11440": "마포구", "11470": "양천구",
        "11500": "강서구", "11530": "구로구", "11545": "금천구", "11560": "영등포구", "11590": "동작구",
        "11620": "관악구", "11650": "서초구", "11680": "강남구", "11710": "송파구", "11740": "강동구"
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                console.log("Starting data load...");
                const fetchCsv = async (url) => {
                    const response = await fetch(url);
                    const buffer = await response.arrayBuffer();
                    const decoder = new TextDecoder('euc-kr');
                    const text = decoder.decode(buffer);
                    const parsed = d3.csvParse(text);
                    return parsed.map(row => {
                        const newRow = {};
                        for (const key in row) newRow[key.trim()] = row[key];
                        return newRow;
                    });
                };

                // Load Dong-level data
                const [salesData, closureData] = await Promise.all([
                    fetchCsv('/sales_dong.csv'),
                    fetchCsv('/store_dong.csv')
                ]);

                // Inject Gu Name based on Dong Code
                const enrichData = (data) => {
                    data.forEach(d => {
                        if (!d['자치구_코드_명'] && d['행정동_코드']) {
                            const guCode = d['행정동_코드'].substring(0, 5);
                            d['자치구_코드_명'] = guCodeMap[guCode] || "Unknown";
                        }
                    });
                };

                enrichData(salesData);
                enrichData(closureData);

                rawSalesDataRef.current = salesData;
                rawClosureDataRef.current = closureData;

                // Extract Filter Options
                const gus = new Set();
                const dongs = {}; // {Gu: [Dong1, Dong2]}
                const industries = new Set();

                salesData.forEach(d => {
                    const gu = d['자치구_코드_명'];
                    const dong = d['행정동_코드_명'];
                    const industry = d['서비스_업종_코드_명'];

                    if (gu) gus.add(gu);
                    if (industry) industries.add(industry);

                    if (gu && dong) {
                        if (!dongs[gu]) dongs[gu] = new Set();
                        dongs[gu].add(dong);
                    }
                });

                setGuList(Array.from(gus).sort());
                setIndustryList(Array.from(industries).sort());

                // Convert Dong Sets to Arrays
                const dongMap = {};
                for (const gu in dongs) {
                    dongMap[gu] = Array.from(dongs[gu]).sort();
                }
                setDongList(dongMap);

                processData(salesData, closureData);

            } catch (error) {
                console.error("Failed to load data:", error);
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Re-process data when filters change
    useEffect(() => {
        if (rawSalesDataRef.current.length > 0) {
            processData(rawSalesDataRef.current, rawClosureDataRef.current);
        }
    }, [selectedGu, selectedDong, selectedIndustry, minRevenue, timeRange]);

    const processData = (salesData, closureData) => {
        setLoading(true);

        // 1. Filter Data
        let filteredSales = salesData;
        let filteredClosure = closureData;

        if (selectedGu !== 'All') {
            filteredSales = filteredSales.filter(d => d['자치구_코드_명'] === selectedGu);
            filteredClosure = filteredClosure.filter(d => d['자치구_코드_명'] === selectedGu);
        }

        if (selectedDong !== 'All') {
            filteredSales = filteredSales.filter(d => d['행정동_코드_명'] === selectedDong);
            filteredClosure = filteredClosure.filter(d => d['행정동_코드_명'] === selectedDong);
        }

        if (selectedIndustry !== 'All') {
            filteredSales = filteredSales.filter(d => d['서비스_업종_코드_명'] === selectedIndustry);
            filteredClosure = filteredClosure.filter(d => d['서비스_업종_코드_명'] === selectedIndustry);
        }

        // 2. Process Historical Data
        const historyMap = {};
        const getYQ = (d) => d['기준_년분기_코드'] ? parseInt(d['기준_년분기_코드']) : parseInt(d['기준_년_코드'] + d['기준_분기_코드']);

        filteredSales.forEach(d => {
            const id = selectedGu === 'All' ? d['자치구_코드_명'] : d['행정동_코드_명'];
            if (!id) return;

            const yq = getYQ(d);
            if (!historyMap[id]) historyMap[id] = [];

            let entry = historyMap[id].find(e => e.yq === yq);
            if (!entry) {
                entry = { yq, sales: 0, weekendSales: 0, count: 0 };
                historyMap[id].push(entry);
            }
            entry.sales += parseFloat(d['당월_매출_금액'] || 0);
            entry.weekendSales += parseFloat(d['주말_매출_금액'] || 0);
            entry.count += 1;
        });

        filteredClosure.forEach(d => {
            const id = selectedGu === 'All' ? d['자치구_코드_명'] : d['행정동_코드_명'];
            if (!id) return;

            const yq = getYQ(d);
            if (historyMap[id]) {
                let entry = historyMap[id].find(e => e.yq === yq);
                if (entry) {
                    entry.closureRate = parseFloat(d['폐업_률'] || 0);
                    entry.survival = 100 - entry.closureRate;
                }
            }
        });

        setHistoryData(historyMap);

        // 3. Process Deep Dive Data
        const deepDiveMap = {};

        filteredSales.forEach(d => {
            const id = selectedGu === 'All' ? d['자치구_코드_명'] : d['행정동_코드_명'];
            if (!id) return;

            if (!deepDiveMap[id]) {
                deepDiveMap[id] = { age: {}, time: {}, day: {} };
            }

            // Age
            const ageCols = {
                "10s": "연령대_10_매출_금액",
                "20s": "연령대_20_매출_금액",
                "30s": "연령대_30_매출_금액",
                "40s": "연령대_40_매출_금액",
                "50s": "연령대_50_매출_금액",
                "60s+": "연령대_60_이상_매출_금액"
            };
            for (const [label, col] of Object.entries(ageCols)) {
                deepDiveMap[id].age[label] = (deepDiveMap[id].age[label] || 0) + parseFloat(d[col] || 0);
            }

            // Time
            const timeCols = {
                "00-06": "시간대_00~06_매출_금액",
                "06-11": "시간대_06~11_매출_금액",
                "11-14": "시간대_11~14_매출_금액",
                "14-17": "시간대_14~17_매출_금액",
                "17-21": "시간대_17~21_매출_금액",
                "21-24": "시간대_21~24_매출_금액"
            };
            for (const [label, col] of Object.entries(timeCols)) {
                deepDiveMap[id].time[label] = (deepDiveMap[id].time[label] || 0) + parseFloat(d[col] || 0);
            }

            // Day
            const dayCols = {
                "Mon": "월요일_매출_금액",
                "Tue": "화요일_매출_금액",
                "Wed": "수요일_매출_금액",
                "Thu": "목요일_매출_금액",
                "Fri": "금요일_매출_금액",
                "Sat": "토요일_매출_금액",
                "Sun": "일요일_매출_금액"
            };
            for (const [label, col] of Object.entries(dayCols)) {
                deepDiveMap[id].day[label] = (deepDiveMap[id].day[label] || 0) + parseFloat(d[col] || 0);
            }
        });

        // Normalize Deep Dive Data
        Object.keys(deepDiveMap).forEach(id => {
            const dd = deepDiveMap[id];
            const totalAge = Object.values(dd.age).reduce((a, b) => a + b, 0);
            if (totalAge > 0) for (const key in dd.age) dd.age[key] = (dd.age[key] / totalAge) * 100;

            const totalTime = Object.values(dd.time).reduce((a, b) => a + b, 0);
            if (totalTime > 0) for (const key in dd.time) dd.time[key] = (dd.time[key] / totalTime) * 100;

            const totalDay = Object.values(dd.day).reduce((a, b) => a + b, 0);
            if (totalDay > 0) for (const key in dd.day) dd.day[key] = (dd.day[key] / totalDay) * 100;
        });

        // 4. Latest Data & Aggregation
        const getMaxYQ = (data) => {
            let maxCode = 0;
            data.forEach(d => {
                const code = getYQ(d);
                if (code > maxCode) maxCode = code;
            });
            return maxCode;
        };

        const maxSalesYQ = getMaxYQ(filteredSales);
        const maxClosureYQ = getMaxYQ(filteredClosure);

        const currentSales = filteredSales.filter(d => getYQ(d) === maxSalesYQ);
        const currentClosure = filteredClosure.filter(d => getYQ(d) === maxClosureYQ);

        const districtMap = new Map();

        currentSales.forEach(d => {
            const id = selectedGu === 'All' ? d['자치구_코드_명'] : d['행정동_코드_명'];
            if (!id) return;

            if (!districtMap.has(id)) {
                districtMap.set(id, {
                    name: id,
                    sales: 0,
                    weekendSales: 0,
                    count: 0,
                    closureRateSum: 0,
                    storeCount: 0,
                    closureCount: 0
                });
            }
            const item = districtMap.get(id);
            item.sales += parseFloat(d['당월_매출_금액'] || 0);
            item.weekendSales += parseFloat(d['주말_매출_금액'] || 0);
            item.count += 1;
        });

        currentClosure.forEach(d => {
            const id = selectedGu === 'All' ? d['자치구_코드_명'] : d['행정동_코드_명'];
            if (districtMap.has(id)) {
                const item = districtMap.get(id);
                item.closureRateSum += parseFloat(d['폐업_률'] || 0);
                item.storeCount += parseFloat(d['점포_수'] || 0);
                item.closureCount += 1;
            }
        });

        // 5. Final Metrics & Filtering by Min Revenue
        let processed = Array.from(districtMap.values()).map(d => {
            return {
                id: d.name,
                name: d.name,
                rawSales: d.sales,
                rawSurvival: d.closureCount > 0 ? (100 - (d.closureRateSum / d.closureCount)) : 0,
                rawSaturation: d.storeCount,
                rawEfficiency: d.storeCount > 0 ? (d.sales / d.storeCount) : 0,
                rawWeekend: d.sales > 0 ? (d.weekendSales / d.sales * 100) : 0,
                deepDive: deepDiveMap[d.name] || { age: {}, time: {}, day: {} }
            };
        });

        // Filter by Minimum Revenue
        if (minRevenue > 0) {
            processed = processed.filter(d => d.rawSales >= minRevenue * 100000000); // Input in 100M KRW
        }

        const getExtents = (key) => d3.extent(processed, d => d[key]);
        const salesExt = getExtents('rawSales');
        const survivalExt = getExtents('rawSurvival');
        const saturationExt = getExtents('rawSaturation');
        const efficiencyExt = getExtents('rawEfficiency');
        const weekendExt = getExtents('rawWeekend');

        const scale = (val, extent) => {
            if (!extent[0] && !extent[1]) return 0;
            if (extent[0] === extent[1]) return 50;
            return ((val - extent[0]) / (extent[1] - extent[0])) * 100;
        };

        const finalData = processed.map(d => ({
            id: d.id,
            name: d.name,
            stats: [
                { axis: "매출력 (Sales)", value: scale(d.rawSales, salesExt), raw: (d.rawSales / 100000000).toFixed(1) + "억원" },
                { axis: "생존력 (Survival)", value: scale(d.rawSurvival, survivalExt), raw: d.rawSurvival.toFixed(1) + "%" },
                { axis: "포화도 (Saturation)", value: scale(d.rawSaturation, saturationExt), raw: d.rawSaturation + "개" },
                { axis: "효율성 (Efficiency)", value: scale(d.rawEfficiency, efficiencyExt), raw: (d.rawEfficiency / 10000).toFixed(1) + "만원/점포" },
                { axis: "주말바이브 (Weekend)", value: scale(d.rawWeekend, weekendExt), raw: d.rawWeekend.toFixed(1) + "%" }
            ],
            deepDive: d.deepDive
        }));

        // Calculate Average
        const avgRaw = { sales: 0, survival: 0, saturation: 0, efficiency: 0, weekend: 0 };
        processed.forEach(d => {
            avgRaw.sales += d.rawSales;
            avgRaw.survival += d.rawSurvival;
            avgRaw.saturation += d.rawSaturation;
            avgRaw.efficiency += d.rawEfficiency;
            avgRaw.weekend += d.rawWeekend;
        });
        const count = processed.length;
        if (count > 0) {
            avgRaw.sales /= count;
            avgRaw.survival /= count;
            avgRaw.saturation /= count;
            avgRaw.efficiency /= count;
            avgRaw.weekend /= count;
        }
        const averageData = {
            stats: [
                { axis: "매출력 (Sales)", value: scale(avgRaw.sales, salesExt), raw: (avgRaw.sales / 100000000).toFixed(1) + "억원" },
                { axis: "생존력 (Survival)", value: scale(avgRaw.survival, survivalExt), raw: avgRaw.survival.toFixed(1) + "%" },
                { axis: "포화도 (Saturation)", value: scale(avgRaw.saturation, saturationExt), raw: avgRaw.saturation.toFixed(0) + "개" },
                { axis: "효율성 (Efficiency)", value: scale(avgRaw.efficiency, efficiencyExt), raw: (avgRaw.efficiency / 10000).toFixed(1) + "만원/점포" },
                { axis: "주말바이브 (Weekend)", value: scale(avgRaw.weekend, weekendExt), raw: avgRaw.weekend.toFixed(1) + "%" }
            ],
            deepDive: null
        };
        setAverageData(averageData);

        setSeoulData(finalData);
        window.seoulData = finalData;

        // Reset selection if invalid
        const validIds = finalData.map(d => d.id);
        const newSelection = selectedIds.filter(id => validIds.includes(id));
        if (newSelection.length < 2 && finalData.length >= 2) {
            setSelectedIds([finalData[0].id, finalData[1].id]);
        } else {
            setSelectedIds(newSelection);
        }

        setLoading(false);
    };

    const handleSelect = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(s => s !== id));
        } else {
            if (selectedIds.length >= 2) {
                setSelectedIds([selectedIds[1], id]);
            } else {
                setSelectedIds([...selectedIds, id]);
            }
        }
    };

    const selectedData = seoulData.filter(d => selectedIds.includes(d.id));

    if (loading) {
        return <div className="loading-container">Loading market data...</div>;
    }

    if (seoulData.length === 0) {
        return (
            <div className="container" style={{ padding: '2rem', color: 'white' }}>
                <h2>⚠️ No Data Loaded</h2>
                <p>No data found matching your criteria. Please adjust filters.</p>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="header">
                <h1>🍗 Seoul Market Radar</h1>
                <p>Compare market stats for Seoul districts & neighborhoods</p>
            </div>

            <div className="dashboard-grid">
                {/* 1. Control Panel */}
                <div className="district-panel">
                    {/* Filters */}
                    <div className="filters-section">
                        <h3>Filters</h3>

                        <div className="filter-group">
                            <label>Region (Gu)</label>
                            <select value={selectedGu} onChange={(e) => {
                                setSelectedGu(e.target.value);
                                setSelectedDong('All'); // Reset Dong when Gu changes
                            }}>
                                <option value="All">All Seoul</option>
                                {guList.map(gu => <option key={gu} value={gu}>{gu}</option>)}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Neighborhood (Dong)</label>
                            <select
                                value={selectedDong}
                                onChange={(e) => setSelectedDong(e.target.value)}
                                disabled={selectedGu === 'All'}
                            >
                                <option value="All">All Neighborhoods</option>
                                {selectedGu !== 'All' && dongList[selectedGu]?.map(dong => (
                                    <option key={dong} value={dong}>{dong}</option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Industry</label>
                            <select value={selectedIndustry} onChange={(e) => setSelectedIndustry(e.target.value)}>
                                <option value="All">All Industries</option>
                                {industryList.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Min. Monthly Revenue (100M KRW)</label>
                            <input
                                type="range"
                                min="0"
                                max="50"
                                step="1"
                                value={minRevenue}
                                onChange={(e) => setMinRevenue(Number(e.target.value))}
                            />
                            <span>{minRevenue} 억+</span>
                        </div>
                    </div>

                    <h3>
                        Select {selectedGu === 'All' ? 'District' : 'Neighborhood'}
                        <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                            ({selectedIds.length}/2)
                        </span>
                    </h3>
                    <div className="district-list">
                        {seoulData.map(d => {
                            const isSelected = selectedIds.includes(d.id);
                            const selectionIndex = selectedIds.indexOf(d.id);
                            const selectionClass = selectionIndex === 0 ? 'selected-1' : selectionIndex === 1 ? 'selected-2' : '';

                            return (
                                <button
                                    key={d.id}
                                    onClick={() => handleSelect(d.id)}
                                    className={`district-btn ${isSelected ? selectionClass : ''}`}
                                >
                                    {d.name}
                                    {isSelected && <span className="dot" style={{ backgroundColor: selectionIndex === 0 ? 'var(--accent-primary)' : 'var(--accent-secondary)' }}></span>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Visualization Area */}
                <ComparisonPanel
                    selectedDistricts={selectedData}
                    historyData={historyData}
                    timeRange={timeRange}
                    averageData={averageData}
                    averageHistory={averageHistory}
                />
            </div>
        </div>
    );
};

export default ChickenBattleArena;