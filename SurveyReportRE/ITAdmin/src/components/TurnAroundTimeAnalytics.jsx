import React, { useEffect, useState, useMemo } from 'react';
import { API_BASE_URL } from '../config';
import '../styles/turnAroundTimeAnalytics.css';

function TurnAroundTimeAnalytics() {
    const [sessions, setSessions] = useState([]);
    const [deptProcessings, setDeptProcessings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecordGuid, setSelectedRecordGuid] = useState('ALL');
    const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
    const [activeTab, setActiveTab] = useState('timeline-axis'); // 'timeline-axis' | 'summary' | 'table'
    const [layoutMode, setLayoutMode] = useState('cycle-flow'); // 'cycle-flow' | 'checkpoint-rows' | 'dept-rows'

    // Fetch data from API on mount
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resSessions, resDepts] = await Promise.all([
                fetch(`${API_BASE_URL}/api/TurnAroundTimeSession/GetAll`).then(r => r.ok ? r.json() : []).catch(() => []),
                fetch(`${API_BASE_URL}/api/TurnAroundTimeDeptProcessing/GetAll`).then(r => r.ok ? r.json() : []).catch(() => [])
            ]);

            const loadedSessions = Array.isArray(resSessions) ? resSessions : [];
            const loadedDepts = Array.isArray(resDepts) ? resDepts : [];

            if (loadedSessions.length > 0 || loadedDepts.length > 0) {
                setSessions(loadedSessions);
                setDeptProcessings(loadedDepts);
            } else {
                // Fallback demo data
                const demoData = generateDemoTatData();
                setSessions(demoData.sessions);
                setDeptProcessings(demoData.deptProcessings);
            }
        } catch (err) {
            console.error("Error fetching TAT data:", err);
            const demoData = generateDemoTatData();
            setSessions(demoData.sessions);
            setDeptProcessings(demoData.deptProcessings);
        } finally {
            setLoading(false);
        }
    };

    // Realistic Demo Data Generator matching user's diagram
    const generateDemoTatData = () => {
        const demoGuid1 = "e7b89f21-4a3b-4c5d-8e9f-112233445566";
        const demoGuid2 = "f8c90a32-5b4c-5d6e-9f0a-223344556677";

        const demoSessions = [
            {
                id: 1,
                sessionNo: 1,
                sessionTypeId: 101,
                sessionStartDate: "2026-07-10T08:00:00Z",
                sessionEndDate: "2026-07-12T17:30:00Z",
                totalDays: 2,
                recordGuid: demoGuid1,
                recordTitle: "Quotation Request TS-2026-001"
            },
            {
                id: 2,
                sessionNo: 2,
                sessionTypeId: 102,
                sessionStartDate: "2026-07-13T09:00:00Z",
                sessionEndDate: "2026-07-15T16:00:00Z",
                totalDays: 3,
                recordGuid: demoGuid1,
                recordTitle: "Quotation Request TS-2026-001 (Loop Round)"
            },
            {
                id: 3,
                sessionNo: 3,
                sessionTypeId: 101,
                sessionStartDate: "2026-07-16T10:00:00Z",
                sessionEndDate: "2026-07-17T15:00:00Z",
                totalDays: 1,
                recordGuid: demoGuid1,
                recordTitle: "Quotation Request TS-2026-001 (Final Review)"
            },
            {
                id: 4,
                sessionNo: 4,
                sessionTypeId: 101,
                sessionStartDate: "2026-07-18T08:00:00Z",
                sessionEndDate: "2026-07-19T17:00:00Z",
                totalDays: 2,
                recordGuid: demoGuid1,
                recordTitle: "Quotation Request TS-2026-001 (Issuance)"
            }
        ];

        const demoDeptProcessings = [
            // Quotation 1 (Session 1): FO -> TS (4h) -> FO -> TS (2h) -> FO -> UW
            { id: 101, turnAroundTimeSessionId: 1, department: "FO", acceptDate: "2026-07-10T08:00:00Z", completeDate: "2026-07-10T10:00:00Z", processingDays: 0, durationText: "2h", note: "FO Khởi tạo hồ sơ" },
            { id: 102, turnAroundTimeSessionId: 1, department: "TS", acceptDate: "2026-07-10T10:00:00Z", completeDate: "2026-07-10T14:00:00Z", processingDays: 0, durationText: "4h", note: "TS Duyệt thông số lần 1" },
            { id: 103, turnAroundTimeSessionId: 1, department: "FO", acceptDate: "2026-07-10T14:00:00Z", completeDate: "2026-07-10T16:00:00Z", processingDays: 0, durationText: "2h", note: "FO Cập nhật thông tin khách hàng" },
            { id: 104, turnAroundTimeSessionId: 1, department: "TS", acceptDate: "2026-07-10T16:00:00Z", completeDate: "2026-07-10T18:00:00Z", processingDays: 0, durationText: "2h", note: "TS Thẩm định bổ sung" },
            { id: 105, turnAroundTimeSessionId: 1, department: "FO", acceptDate: "2026-07-11T08:00:00Z", completeDate: "2026-07-11T10:00:00Z", processingDays: 0, durationText: "2h", note: "FO Trình cấp đơn" },
            { id: 106, turnAroundTimeSessionId: 1, department: "UW", acceptDate: "2026-07-11T10:00:00Z", completeDate: "2026-07-12T17:30:00Z", processingDays: 1, durationText: "1.5 ngày", note: "UW Duyệt cấp đơn thành công" },

            // Quotation 2 (Session 2 Loop): FO -> TS (1st 1h) -> FO -> TS (2nd 2h) -> FO -> UW
            { id: 107, turnAroundTimeSessionId: 2, department: "FO", acceptDate: "2026-07-13T09:00:00Z", completeDate: "2026-07-13T10:00:00Z", processingDays: 0, durationText: "1h", note: "FO Nhận yêu cầu sửa đổi" },
            { id: 108, turnAroundTimeSessionId: 2, department: "TS", acceptDate: "2026-07-13T10:00:00Z", completeDate: "2026-07-13T11:00:00Z", processingDays: 0, durationText: "1st 1h", note: "TS Thẩm định điều khoản 1" },
            { id: 109, turnAroundTimeSessionId: 2, department: "FO", acceptDate: "2026-07-13T11:00:00Z", completeDate: "2026-07-13T14:00:00Z", processingDays: 0, durationText: "3h", note: "FO Trao đổi với khách hàng" },
            { id: 110, turnAroundTimeSessionId: 2, department: "TS", acceptDate: "2026-07-13T14:00:00Z", completeDate: "2026-07-13T16:00:00Z", processingDays: 0, durationText: "2nd 2h", note: "TS Thẩm định điều khoản 2" },
            { id: 111, turnAroundTimeSessionId: 2, department: "FO", acceptDate: "2026-07-14T08:00:00Z", completeDate: "2026-07-14T10:00:00Z", processingDays: 0, durationText: "2h", note: "FO Gửi UW đánh giá rủi ro" },
            { id: 112, turnAroundTimeSessionId: 2, department: "UW", acceptDate: "2026-07-14T10:00:00Z", completeDate: "2026-07-15T16:00:00Z", processingDays: 1, durationText: "4th 4h", note: "UW Duyệt bổ sung" },

            // Quotation 3 (Session 3): FO -> TS (5h) -> FO -> UW
            { id: 113, turnAroundTimeSessionId: 3, department: "FO", acceptDate: "2026-07-16T10:00:00Z", completeDate: "2026-07-16T11:00:00Z", processingDays: 0, durationText: "1h", note: "FO Yêu cầu báo giá lại" },
            { id: 114, turnAroundTimeSessionId: 3, department: "TS", acceptDate: "2026-07-16T11:00:00Z", completeDate: "2026-07-16T16:00:00Z", processingDays: 0, durationText: "5h", note: "TS Tái thẩm định tổng thể" },
            { id: 115, turnAroundTimeSessionId: 3, department: "FO", acceptDate: "2026-07-16T16:00:00Z", completeDate: "2026-07-17T09:00:00Z", processingDays: 0, durationText: "2h", note: "FO Chuẩn bị tờ trình" },
            { id: 116, turnAroundTimeSessionId: 3, department: "UW", acceptDate: "2026-07-17T09:00:00Z", completeDate: "2026-07-17T15:00:00Z", processingDays: 0, durationText: "6h", note: "UW Chấp nhận cấp bảo hiểm" },

            // Quotation 4 (Session 4): FO -> TS (2h) -> FO -> UW -> TS (1h) -> FO
            { id: 117, turnAroundTimeSessionId: 4, department: "FO", acceptDate: "2026-07-18T08:00:00Z", completeDate: "2026-07-18T10:00:00Z", processingDays: 0, durationText: "2h", note: "FO Bắt đầu phát hành" },
            { id: 118, turnAroundTimeSessionId: 4, department: "TS", acceptDate: "2026-07-18T10:00:00Z", completeDate: "2026-07-18T12:00:00Z", processingDays: 0, durationText: "2h", note: "TS Kiểm tra biểu phí" },
            { id: 119, turnAroundTimeSessionId: 4, department: "FO", acceptDate: "2026-07-18T13:00:00Z", completeDate: "2026-07-18T15:00:00Z", processingDays: 0, durationText: "2h", note: "FO Chuyển UW phê duyệt" },
            { id: 120, turnAroundTimeSessionId: 4, department: "UW", acceptDate: "2026-07-18T15:00:00Z", completeDate: "2026-07-19T10:00:00Z", processingDays: 1, durationText: "1 ngày", note: "UW Xem xét điều khoản phụ" },
            { id: 121, turnAroundTimeSessionId: 4, department: "TS", acceptDate: "2026-07-19T10:00:00Z", completeDate: "2026-07-19T11:00:00Z", processingDays: 0, durationText: "1h", note: "TS Xác nhận bản cứng" },
            { id: 122, turnAroundTimeSessionId: 4, department: "FO", acceptDate: "2026-07-19T11:00:00Z", completeDate: "2026-07-19T17:00:00Z", processingDays: 0, durationText: "6h", note: "FO Hoàn tất & Bàn giao" }
        ];

        return { sessions: demoSessions, deptProcessings: demoDeptProcessings };
    };

    // List of unique RecordGuids
    const recordGuidOptions = useMemo(() => {
        const guids = [];
        const seen = new Set();
        sessions.forEach(s => {
            const g = s.recordGuid || s.RecordGuid;
            if (g && !seen.has(g)) {
                seen.add(g);
                guids.push({
                    guid: g,
                    title: s.recordTitle || `Instance ${g.slice(0, 8)}...`
                });
            }
        });
        return guids;
    }, [sessions]);

    // Filtered Sessions & Checkpoints based on user selection
    const filteredSessions = useMemo(() => {
        if (selectedRecordGuid === 'ALL') return sessions;
        return sessions.filter(s => String(s.recordGuid || s.RecordGuid) === String(selectedRecordGuid));
    }, [sessions, selectedRecordGuid]);

    const filteredSessionIds = useMemo(() => {
        return new Set(filteredSessions.map(s => String(s.id || s.Id)));
    }, [filteredSessions]);

    const filteredCheckpoints = useMemo(() => {
        let list = deptProcessings.filter(dp => {
            const sId = String(dp.turnAroundTimeSessionId || dp.TurnAroundTimeSessionId);
            return filteredSessionIds.has(sId);
        });

        if (selectedDeptFilter !== 'ALL') {
            list = list.filter(dp => (dp.department || dp.Department) === selectedDeptFilter);
        }

        // Sort chronologically by AcceptDate
        return list.sort((a, b) => {
            const da = new Date(a.acceptDate || a.AcceptDate || 0);
            const db = new Date(b.acceptDate || b.AcceptDate || 0);
            return da - db;
        });
    }, [deptProcessings, filteredSessionIds, selectedDeptFilter]);

    // Sessions Grouped Data for Cycle Flow Mode
    const cycleSessionsGrouped = useMemo(() => {
        return filteredSessions.map(s => {
            const sId = String(s.id || s.Id);
            const cps = deptProcessings
                .filter(dp => String(dp.turnAroundTimeSessionId || dp.TurnAroundTimeSessionId) === sId)
                .sort((a, b) => new Date(a.acceptDate || a.AcceptDate || 0) - new Date(b.acceptDate || b.AcceptDate || 0));

            // Detect if department has loops (multiple occurrences)
            const deptCounts = {};
            let isLoop = false;
            cps.forEach(cp => {
                const d = cp.department || cp.Department;
                deptCounts[d] = (deptCounts[d] || 0) + 1;
                if (deptCounts[d] > 1) isLoop = true;
            });

            return {
                sessionId: sId,
                sessionNo: s.sessionNo || s.SessionNo || 1,
                title: s.recordTitle || `Quotation ${s.sessionNo || s.SessionNo || 1}`,
                totalDays: s.totalDays || s.TotalDays || 0,
                isLoop,
                checkpoints: cps
            };
        });
    }, [filteredSessions, deptProcessings]);

    // Time Axis Calculations (Global Min Date & Max Date)
    const timeAxisBounds = useMemo(() => {
        if (filteredCheckpoints.length === 0) {
            const now = new Date();
            return { minTime: now.getTime(), maxTime: now.getTime() + 86400000, totalSpanMs: 86400000, ticks: [] };
        }

        let minTime = Infinity;
        let maxTime = -Infinity;

        filteredCheckpoints.forEach(cp => {
            const acc = new Date(cp.acceptDate || cp.AcceptDate).getTime();
            const comp = cp.completeDate || cp.CompleteDate ? new Date(cp.completeDate || cp.CompleteDate).getTime() : new Date().getTime();

            if (!isNaN(acc) && acc < minTime) minTime = acc;
            if (!isNaN(comp) && comp > maxTime) maxTime = comp;
        });

        if (minTime === Infinity || maxTime === -Infinity || maxTime <= minTime) {
            minTime = new Date().getTime() - 86400000;
            maxTime = new Date().getTime();
        }

        const rawSpan = maxTime - minTime;
        const pad = Math.max(3600000, rawSpan * 0.03);
        minTime = minTime - pad;
        maxTime = maxTime + pad;
        const totalSpanMs = maxTime - minTime;

        const ticksCount = 6;
        const ticks = [];
        for (let i = 0; i < ticksCount; i++) {
            const t = minTime + (totalSpanMs * (i / (ticksCount - 1)));
            const d = new Date(t);
            const label = `${d.getDate()}/${d.getMonth() + 1} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
            const percent = (i / (ticksCount - 1)) * 100;
            ticks.push({ time: t, label, percent });
        }

        return { minTime, maxTime, totalSpanMs, ticks };
    }, [filteredCheckpoints]);

    // Group Checkpoints by Department (for Grouped Dept Rows Layout)
    const deptGroupedRows = useMemo(() => {
        const map = {};
        filteredCheckpoints.forEach(cp => {
            const dept = cp.department || cp.Department || 'N/A';
            if (!map[dept]) map[dept] = [];
            map[dept].push(cp);
        });
        return Object.keys(map).map(dept => ({
            dept,
            checkpoints: map[dept]
        }));
    }, [filteredCheckpoints]);

    // Calculate Analytical Metrics
    const metrics = useMemo(() => {
        let totalDurationMs = 0;
        let totalCheckpoints = filteredCheckpoints.length;
        const deptTimeMap = {};
        const deptCountMap = {};

        filteredCheckpoints.forEach(cp => {
            const dept = cp.department || cp.Department || 'N/A';
            const accept = new Date(cp.acceptDate || cp.AcceptDate);
            const complete = cp.completeDate || cp.CompleteDate ? new Date(cp.completeDate || cp.CompleteDate) : new Date();

            let diffMs = complete - accept;
            if (isNaN(diffMs) || diffMs < 0) diffMs = 0;

            totalDurationMs += diffMs;
            deptTimeMap[dept] = (deptTimeMap[dept] || 0) + diffMs;
            deptCountMap[dept] = (deptCountMap[dept] || 0) + 1;
        });

        const totalHours = Math.round(totalDurationMs / (1000 * 60 * 60));
        const totalDays = (totalDurationMs / (1000 * 60 * 60 * 24)).toFixed(1);

        let bottleneckDept = 'N/A';
        let maxTime = -1;
        Object.keys(deptTimeMap).forEach(dept => {
            if (deptTimeMap[dept] > maxTime) {
                maxTime = deptTimeMap[dept];
                bottleneckDept = dept;
            }
        });

        return {
            totalDurationMs,
            totalHours,
            totalDays,
            totalCheckpoints,
            distinctDeptsCount: Object.keys(deptTimeMap).length,
            bottleneckDept,
            deptTimeMap,
            deptCountMap
        };
    }, [filteredCheckpoints]);

    const formatDuration = (startStr, endStr) => {
        if (!startStr) return 'N/A';
        const start = new Date(startStr);
        const end = endStr ? new Date(endStr) : new Date();
        const diffMs = Math.max(0, end - start);
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        const remHours = hours % 24;

        if (days > 0) return `${days} ngày ${remHours > 0 ? remHours + 'h' : ''}`;
        return `${hours} giờ`;
    };

    const getDeptBadgeClass = (dept) => {
        switch ((dept || '').toUpperCase()) {
            case 'FO': return 'dept-badge dept-fo';
            case 'TS': return 'dept-badge dept-ts';
            case 'PM': return 'dept-badge dept-pm';
            case 'UW': return 'dept-badge dept-uw';
            case 'LMKT': return 'dept-badge dept-lmkt';
            default: return 'dept-badge dept-default';
        }
    };

    const getDeptNodeClass = (dept) => {
        switch ((dept || '').toUpperCase()) {
            case 'FO': return 'cycle-node-box node-bg-fo';
            case 'TS': return 'cycle-node-box node-bg-ts';
            case 'UW': return 'cycle-node-box node-bg-uw';
            case 'PM': return 'cycle-node-box node-bg-pm';
            case 'LMKT': return 'cycle-node-box node-bg-lmkt';
            default: return 'cycle-node-box node-bg-default';
        }
    };

    const calculateBlockPosition = (acceptStr, completeStr) => {
        const { minTime, totalSpanMs } = timeAxisBounds;
        const acceptTime = new Date(acceptStr).getTime();
        const completeTime = completeStr ? new Date(completeStr).getTime() : new Date().getTime();

        const leftPercent = Math.max(0, Math.min(95, ((acceptTime - minTime) / totalSpanMs) * 100));
        const rightPercent = Math.max(0, Math.min(100, ((completeTime - minTime) / totalSpanMs) * 100));
        let widthPercent = rightPercent - leftPercent;

        if (widthPercent < 5) widthPercent = 5;

        return { left: `${leftPercent.toFixed(2)}%`, width: `${widthPercent.toFixed(2)}%` };
    };

    return (
        <div className="tat-analytics-container">
            {/* Header & Filter Bar */}
            <div className="tat-header">
                <div className="header-title">
                    <h2>📊 Biểu Đồ Chu Kỳ Xử Lý TAT (Turn Around Time Cycle Diagram)</h2>
                    <p>Trực quan hóa chu kỳ xử lý dạng Sơ đồ Node lặp (Cycle Flow) hoặc Sơ đồ Trục thời gian (Time Axis Gantt)</p>
                </div>
                <div className="header-actions">
                    <button className="btn-refresh" onClick={fetchData} title="Tải lại dữ liệu">
                        🔄 Tải lại
                    </button>
                </div>
            </div>

            {/* Filter controls */}
            <div className="tat-filter-card">
                <div className="filter-group">
                    <label>📌 Chọn Instance / Hồ sơ (RecordGuid):</label>
                    <select
                        value={selectedRecordGuid}
                        onChange={(e) => setSelectedRecordGuid(e.target.value)}
                        className="filter-select"
                    >
                        <option value="ALL">-- Tất cả Hồ sơ (All Instances) --</option>
                        {recordGuidOptions.map(opt => (
                            <option key={opt.guid} value={opt.guid}>
                                {opt.title} ({opt.guid.slice(0, 8)}...)
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label>🏢 Lọc Theo Phòng Ban:</label>
                    <select
                        value={selectedDeptFilter}
                        onChange={(e) => setSelectedDeptFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="ALL">-- Tất cả Phòng Ban --</option>
                        <option value="FO">FO (Front Office)</option>
                        <option value="TS">TS (Technical Support)</option>
                        <option value="PM">PM (Project / Reinsurance)</option>
                        <option value="UW">UW (Underwriting)</option>
                        <option value="LMKT">LMKT (Market Research)</option>
                    </select>
                </div>

                {activeTab === 'timeline-axis' && (
                    <div className="filter-group">
                        <label>🎨 Bố trí Sơ Đồ (Diagram Mode):</label>
                        <select
                            value={layoutMode}
                            onChange={(e) => setLayoutMode(e.target.value)}
                            className="filter-select"
                            style={{ fontWeight: "600", color: "#2563eb" }}
                        >
                            <option value="cycle-flow">🔄 Sơ Đồ Chu Kỳ Lặp (Cycle Node Flow - Mẫu)</option>
                            <option value="checkpoint-rows">🗺️ Trục Thời Gian - Mỗi Checkpoint 1 Row</option>
                            <option value="dept-rows">🏢 Trục Thời Gian - Gộp Hàng Phòng Ban</option>
                        </select>
                    </div>
                )}
            </div>

            {/* KPI Cards */}
            <div className="tat-kpi-grid">
                <div className="kpi-card highlight-blue">
                    <div className="kpi-icon">⏱️</div>
                    <div className="kpi-info">
                        <span className="kpi-label">Tổng Thời Gian Chu Kỳ (Total Cycle)</span>
                        <span className="kpi-value">{metrics.totalDays} Ngày <small>({metrics.totalHours} giờ)</small></span>
                    </div>
                </div>

                <div className="kpi-card highlight-green">
                    <div className="kpi-icon">📌</div>
                    <div className="kpi-info">
                        <span className="kpi-label">Tổng Số Checkpoint Xử Lý</span>
                        <span className="kpi-value">{metrics.totalCheckpoints} <small>lượt phòng ban</small></span>
                    </div>
                </div>

                <div className="kpi-card highlight-purple">
                    <div className="kpi-icon">🏢</div>
                    <div className="kpi-info">
                        <span className="kpi-label">Số Phòng Ban Tham Gia</span>
                        <span className="kpi-value">{metrics.distinctDeptsCount} <small>phòng ban</small></span>
                    </div>
                </div>

                <div className="kpi-card highlight-amber">
                    <div className="kpi-icon">⚠️</div>
                    <div className="kpi-info">
                        <span className="kpi-label">Phòng Ban Chiếm TAT Cao Nhất</span>
                        <span className="kpi-value">{metrics.bottleneckDept}</span>
                    </div>
                </div>
            </div>

            {/* View Mode Navigation Tabs */}
            <div className="tat-tabs">
                <button
                    className={`tab-btn ${activeTab === 'timeline-axis' ? 'active' : ''}`}
                    onClick={() => setActiveTab('timeline-axis')}
                >
                    🔄 Sơ Đồ Chu Kỳ Lặp TAT (Cycle Flow & Time Axis)
                </button>
                <button
                    className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
                    onClick={() => setActiveTab('summary')}
                >
                    📊 Cộng Tổng Thời Gian Theo Phòng Ban
                </button>
                <button
                    className={`tab-btn ${activeTab === 'table' ? 'active' : ''}`}
                    onClick={() => setActiveTab('table')}
                >
                    📋 Bảng Chi Tiết Checkpoint (Data Grid)
                </button>
            </div>

            {/* Main Content Area */}
            {loading ? (
                <div className="tat-loading">
                    <div className="spinner" />
                    <span>Đang tải dữ liệu chu kỳ TAT...</span>
                </div>
            ) : (
                <div className="tat-tab-content">
                    {/* TAB 1: DIAGRAM VIEWS (CYCLE FLOW OR TIME AXIS) */}
                    {activeTab === 'timeline-axis' && (
                        <>
                            {/* MODE 1: CYCLE NODE FLOW (MAU HIEN THI THEO ANH YEU CAU) */}
                            {layoutMode === 'cycle-flow' && (
                                <div className="cycle-outer-card">
                                    <div className="cycle-outer-header">
                                        <span className="outer-title-text">
                                            📋 {selectedRecordGuid !== 'ALL' 
                                                ? (sessions.find(s => String(s.recordGuid || s.RecordGuid) === String(selectedRecordGuid))?.recordTitle || `Quotation Request (${selectedRecordGuid.slice(0, 8)})`)
                                                : 'Quotation Request / Instance Cycle Flow'
                                            }
                                        </span>
                                    </div>

                                    <div className="cycle-sessions-list">
                                        {cycleSessionsGrouped.map((sGroup) => (
                                            <div key={sGroup.sessionId} className="cycle-session-box">
                                                <div className="cycle-session-title">
                                                    Quotation {sGroup.sessionNo} {sGroup.isLoop ? '(Loop)' : ''}
                                                </div>

                                                <div className="cycle-nodes-row">
                                                    {sGroup.checkpoints.map((cp, idx) => {
                                                        const isLast = idx === sGroup.checkpoints.length - 1;
                                                        const dept = cp.department || cp.Department || 'N/A';
                                                        const durText = cp.durationText || formatDuration(cp.acceptDate, cp.completeDate);

                                                        return (
                                                            <React.Fragment key={cp.id || idx}>
                                                                {/* Colored Node Block Box */}
                                                                <div className={getDeptNodeClass(dept)}>
                                                                    <span className="node-label">{dept}</span>

                                                                    {/* Tooltip on hover */}
                                                                    <div className="node-tooltip">
                                                                        <strong>Step #{idx + 1}: {dept}</strong>
                                                                        <div>Accept: {cp.acceptDate ? new Date(cp.acceptDate).toLocaleString('vi-VN') : '---'}</div>
                                                                        <div>Complete: {cp.completeDate ? new Date(cp.completeDate).toLocaleString('vi-VN') : 'Đang xử lý'}</div>
                                                                        <div>Thời gian: {durText}</div>
                                                                        {cp.note && <div className="tooltip-note">{cp.note}</div>}
                                                                    </div>
                                                                </div>

                                                                {/* Arrow Connector between nodes */}
                                                                {!isLast && (
                                                                    <div className="cycle-arrow-container">
                                                                        <div className="arrow-line-wrapper">
                                                                            <span className="arrow-line" />
                                                                            <span className="arrow-head">▶</span>
                                                                        </div>
                                                                        <span className="arrow-duration-label">{durText}</span>
                                                                    </div>
                                                                )}
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </div>

                                                {/* Curved Loop / Return Line indicator if there's a loop */}
                                                {sGroup.isLoop && (
                                                    <div className="cycle-loop-arc">
                                                        <div className="arc-line-container">
                                                            <span className="arc-curve" />
                                                            <span className="arc-text">↩️ 3rd 2h / 4th 4h (Return Loop)</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* MODE 2 & 3: TIME AXIS GANTT BLOCK DIAGRAM */}
                            {layoutMode !== 'cycle-flow' && (
                                <div className="axis-diagram-card">
                                    <div className="card-header">
                                        <h3>Sơ Đồ Chu Kỳ Trục Thời Gian (Time Axis Block Diagram)</h3>
                                        <p>Trục thời gian chạy ngang từ <strong>Accept Date đầu tiên</strong> đến <strong>Complete Date cuối cùng</strong>.</p>
                                    </div>

                                    {filteredCheckpoints.length === 0 ? (
                                        <div className="no-data">Không có dữ liệu checkpoint phù hợp với bộ lọc.</div>
                                    ) : (
                                        <div className="time-axis-diagram">
                                            {/* HORIZONTAL TIME AXIS HEADER BAR */}
                                            <div className="axis-header-row">
                                                <div className="axis-label-col">Phòng Ban / Row</div>
                                                <div className="axis-track-col">
                                                    {timeAxisBounds.ticks.map((tick, i) => (
                                                        <div key={i} className="axis-tick-marker" style={{ left: `${tick.percent}%` }}>
                                                            <span className="tick-line" />
                                                            <span className="tick-label">{tick.label}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* DIAGRAM BODY ROWS */}
                                            <div className="axis-body-rows">
                                                {layoutMode === 'checkpoint-rows' ? (
                                                    filteredCheckpoints.map((cp, idx) => {
                                                        const dept = cp.department || cp.Department || 'N/A';
                                                        const acceptStr = cp.acceptDate || cp.AcceptDate;
                                                        const completeStr = cp.completeDate || cp.CompleteDate;
                                                        const durationText = formatDuration(acceptStr, completeStr);
                                                        const pos = calculateBlockPosition(acceptStr, completeStr);

                                                        return (
                                                            <div key={cp.id || cp.Id || idx} className="axis-row">
                                                                <div className="axis-row-title">
                                                                    <span className="step-seq">#{idx + 1}</span>
                                                                    <span className={getDeptBadgeClass(dept)}>{dept}</span>
                                                                </div>

                                                                <div className="axis-row-track">
                                                                    {timeAxisBounds.ticks.map((tick, i) => (
                                                                        <span key={i} className="grid-vert-line" style={{ left: `${tick.percent}%` }} />
                                                                    ))}

                                                                    <div
                                                                        className={`block-item dept-bg-${dept.toLowerCase()}`}
                                                                        style={{ left: pos.left, width: pos.width }}
                                                                    >
                                                                        <div className="block-inner">
                                                                            <span className="block-dept-name">{dept}</span>
                                                                            <span className="block-duration">{durationText}</span>
                                                                        </div>

                                                                        <div className="block-popover">
                                                                            <div className="popover-header">
                                                                                <strong>#{idx + 1} Phòng ban {dept}</strong>
                                                                            </div>
                                                                            <div className="popover-body">
                                                                                <div>🟢 <strong>Bắt đầu (Accept):</strong> {acceptStr ? new Date(acceptStr).toLocaleString('vi-VN') : '---'}</div>
                                                                                <div>🔴 <strong>Kết thúc (Complete):</strong> {completeStr ? new Date(completeStr).toLocaleString('vi-VN') : 'Đang xử lý...'}</div>
                                                                                <div>⏱️ <strong>Thời gian:</strong> {durationText}</div>
                                                                                {cp.note && <div className="popover-note">📝 {cp.note}</div>}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    deptGroupedRows.map(({ dept, checkpoints }) => (
                                                        <div key={dept} className="axis-row">
                                                            <div className="axis-row-title">
                                                                <span className={getDeptBadgeClass(dept)}>{dept}</span>
                                                                <small className="dept-count">({checkpoints.length} lượt)</small>
                                                            </div>

                                                            <div className="axis-row-track">
                                                                {timeAxisBounds.ticks.map((tick, i) => (
                                                                    <span key={i} className="grid-vert-line" style={{ left: `${tick.percent}%` }} />
                                                                ))}

                                                                {checkpoints.map((cp, idx) => {
                                                                    const acceptStr = cp.acceptDate || cp.AcceptDate;
                                                                    const completeStr = cp.completeDate || cp.CompleteDate;
                                                                    const durationText = formatDuration(acceptStr, completeStr);
                                                                    const pos = calculateBlockPosition(acceptStr, completeStr);

                                                                    return (
                                                                        <div
                                                                            key={cp.id || cp.Id || idx}
                                                                            className={`block-item dept-bg-${dept.toLowerCase()}`}
                                                                            style={{ left: pos.left, width: pos.width }}
                                                                        >
                                                                            <div className="block-inner">
                                                                                <span className="block-dept-name">{dept} Lần {idx + 1}</span>
                                                                                <span className="block-duration">{durationText}</span>
                                                                            </div>

                                                                            <div className="block-popover">
                                                                                <div className="popover-header">
                                                                                    <strong>Phòng ban {dept} (Lượt {idx + 1})</strong>
                                                                                </div>
                                                                                <div className="popover-body">
                                                                                    <div>🟢 <strong>Bắt đầu (Accept):</strong> {acceptStr ? new Date(acceptStr).toLocaleString('vi-VN') : '---'}</div>
                                                                                    <div>🔴 <strong>Kết thúc (Complete):</strong> {completeStr ? new Date(completeStr).toLocaleString('vi-VN') : 'Đang xử lý...'}</div>
                                                                                    <div>⏱️ <strong>Thời gian:</strong> {durationText}</div>
                                                                                    {cp.note && <div className="popover-note">📝 {cp.note}</div>}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {/* TAB 2: AGGREGATED DEPARTMENT SUMMARY */}
                    {activeTab === 'summary' && (
                        <div className="summary-card">
                            <div className="card-header">
                                <h3>Cộng Tổng Thời Gian Xử Lý Theo Phòng Ban (Department TAT Aggregate)</h3>
                                <p>Tổng hợp tổng số ngày/giờ xử lý lũy kế của từng phòng ban trong toàn bộ chu kỳ đơn</p>
                            </div>

                            <div className="dept-summary-grid">
                                {Object.keys(metrics.deptTimeMap).map(dept => {
                                    const totalMs = metrics.deptTimeMap[dept];
                                    const hours = Math.round(totalMs / (1000 * 60 * 60));
                                    const days = (totalMs / (1000 * 60 * 60 * 24)).toFixed(1);
                                    const count = metrics.deptCountMap[dept] || 0;
                                    const percent = metrics.totalDurationMs > 0 ? Math.round((totalMs / metrics.totalDurationMs) * 100) : 0;

                                    return (
                                        <div key={dept} className="dept-summary-box">
                                            <div className="box-top">
                                                <span className={getDeptBadgeClass(dept)}>{dept}</span>
                                                <span className="percent-badge">{percent}% Tổng chu kỳ</span>
                                            </div>

                                            <div className="box-body">
                                                <div className="big-stat">{days} <small>Ngày</small></div>
                                                <div className="sub-stat">Tương đương {hours} giờ ({count} lượt checkpoint)</div>

                                                <div className="stat-bar-container">
                                                    <div className="stat-bar-fill" style={{ width: `${percent}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* TAB 3: DATA GRID TABLE */}
                    {activeTab === 'table' && (
                        <div className="table-card">
                            <div className="card-header">
                                <h3>Chi Tiết Bảng Dữ Liệu Checkpoint (dbo.TurnAroundTimeDeptProcessing)</h3>
                            </div>
                            <div className="table-wrapper">
                                <table className="tat-table">
                                    <thead>
                                        <tr>
                                            <th># ID</th>
                                            <th>Session ID</th>
                                            <th>Phòng Ban</th>
                                            <th>Accept Date (Bắt đầu)</th>
                                            <th>Complete Date (Kết thúc)</th>
                                            <th>Processing Days</th>
                                            <th>Trạng Thái</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredCheckpoints.map(cp => (
                                            <tr key={cp.id || cp.Id}>
                                                <td>{cp.id || cp.Id}</td>
                                                <td>{cp.turnAroundTimeSessionId || cp.TurnAroundTimeSessionId}</td>
                                                <td><span className={getDeptBadgeClass(cp.department || cp.Department)}>{cp.department || cp.Department}</span></td>
                                                <td>{cp.acceptDate || cp.AcceptDate ? new Date(cp.acceptDate || cp.AcceptDate).toLocaleString('vi-VN') : '---'}</td>
                                                <td>{cp.completeDate || cp.CompleteDate ? new Date(cp.completeDate || cp.CompleteDate).toLocaleString('vi-VN') : '---'}</td>
                                                <td><strong>{cp.processingDays || cp.ProcessingDays || 0} ngày</strong></td>
                                                <td>
                                                    {(cp.completeDate || cp.CompleteDate) ? (
                                                        <span className="status-pill completed">Hoàn thành</span>
                                                    ) : (
                                                        <span className="status-pill in-progress">Đang xử lý</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default TurnAroundTimeAnalytics;
