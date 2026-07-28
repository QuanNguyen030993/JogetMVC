import { useMemo, useState } from "react";

import {

  ResponsiveContainer,

  BarChart,

  Bar,

  XAxis,

  YAxis,

  Tooltip,

  CartesianGrid,

  LabelList

} from "recharts";

function Card({ title, value }) {
  const isNumber = typeof value === 'number' || (typeof value === 'string' && !isNaN(value));
  return (
<div

      style={{

        background: "#fff",

        padding: "4px 8px",

        borderRadius: 8,

        boxShadow: "0 1px 3px rgba(0,0,0,.1)",

        display: "flex",

        flexDirection: "column",

        justifyContent: "center",

        minHeight: "36px"

      }}
>
{title && (
<div

        style={{

          color: "#666",

          marginBottom: 1,

          fontSize: "11px",

          lineHeight: "1.1"

        }}
>

        {title}
</div>
)}
<div

        style={{

          fontSize: isNumber ? "13px" : "11px",

          fontWeight: 700,

          color: isNumber ? "#0f172a" : "#2563eb",

          lineHeight: "1.2"

        }}
>

        {value}
</div>
</div>

  );

}

function LegendItem({ color, label }) {

  return (
<div

      style={{

        display: "flex",

        alignItems: "center",

        gap: 6,

        fontSize: 11

      }}
>
<span

        style={{

          width: 11,

          height: 11,

          borderRadius: 2,

          background: color,

          display: "inline-block"

        }}

      />
<span>{label}</span>
</div>

  );

}

function StatusChart({

  title,

  data,

  background,

  yAxisMax

}) {

  return (
<div

      style={{

        minWidth: 0,

        background,

        borderRadius: 12,

        padding: "10px 8px 8px"

      }}
>
<div

        style={{

          marginBottom: 8,

          textAlign: "center",

          fontSize: 12,

          fontWeight: 700

        }}
>

        {title}
</div>
<div

        style={{

          height: 320

        }}
>

        {data.length > 0 ? (
<ResponsiveContainer

            width="100%"

            height="100%"
>
<BarChart

              data={data}

              margin={{

                top: 10,

                right: 12,

                left: 0,

                bottom: 35

              }}

              barCategoryGap="25%"
>
<CartesianGrid

                strokeDasharray="3 3"

                vertical={false}

              />
<XAxis

                dataKey="name"

                interval={0}

                angle={-20}

                textAnchor="end"

                height={50}
                style={{ fontSize: 10 }}

              />
<YAxis

                domain={[0, yAxisMax]}

                allowDecimals={false}
                style={{ fontSize: 11 }}

              />
<Tooltip

                cursor={{

                  fill: "rgba(0,0,0,0.04)"

                }}

                formatter={(value, name) => [

                  value,

                  name

                ]}

              />
<Bar

                dataKey="Pending"

                stackId="status"

                fill="#999998"

              >
                <LabelList dataKey="Pending" position="center" fill="#1e2937" style={{ fontWeight: 'bold', fontSize: 11 }} formatter={v => v > 0 ? v : ''} />
              </Bar>

<Bar

                dataKey="InProgress"

                stackId="status"

                fill="#fbbf24"

                radius={[4, 4, 0, 0]}

              >
                <LabelList dataKey="InProgress" position="center" fill="#fff" style={{ fontWeight: 'bold', fontSize: 11 }} formatter={v => v > 0 ? v : ''} />
              </Bar>
              <Bar

                dataKey="Completed"

                stackId="status"

                fill="#22c55e"

              >
                <LabelList dataKey="Completed" position="center" fill="#fff" style={{ fontWeight: 'bold', fontSize: 11 }} formatter={v => v > 0 ? v : ''} />
              </Bar>
</BarChart>
</ResponsiveContainer>

        ) : (
<div

            style={{

              height: "100%",

              display: "flex",

              justifyContent: "center",

              alignItems: "center",

              color: "#777"

            }}
>

            No data
</div>

        )}
</div>
</div>

  );

}

export default function WorkloadChart({
  data = []
}) {
  const [scope, setScope] = useState("department");
  const [department, setDepartment] = useState("All");
  const [member, setMember] = useState("All");

  // Time filters state
  const [yearFilter, setYearFilter] = useState("All");
  const [quarterFilter, setQuarterFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("All");

  // In-memory data enrichment: Assign region & date to each item deterministically
  const enrichedData = useMemo(() => {
    return data.map((item, index) => {
      if (item.date && item.region) return item;

      // Deterministic region assignment: divide members
      const northMembers = ["An", "Binh", "Hieu", "Khanh", "Nam", "Phuong", "Van", "Giang"];
      const region = northMembers.includes(item.member) ? "Miền Bắc" : "Miền Nam";

      // Deterministic date assignment: spread over years 2025-2026 and months 1-12
      const year = index % 3 === 0 ? 2025 : 2026;
      const month = (index % 12) + 1; // 1 to 12
      const day = (index % 28) + 1; // 1 to 28
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      return {
        ...item,
        region,
        date: dateStr,
        year,
        month,
        quarter: Math.ceil(month / 3) // 1 to 4
      };
    });
  }, [data]);

  const departments = useMemo(() => {
    return [
      "All",
      ...new Set(
        enrichedData
          .map(item => item.department)
          .filter(Boolean)
      )
    ];
  }, [enrichedData]);

  const members = useMemo(() => {
    const rows = enrichedData.filter(
      item =>
        department === "All" ||
        item.department === department
    );
    return [
      "All",
      ...new Set(
        rows
          .map(item => item.member)
          .filter(Boolean)
      )
    ];
  }, [enrichedData, department]);

  const filteredData = useMemo(() => {
    return enrichedData.filter(
      item =>
        (department === "All" || item.department === department) &&
        (member === "All" || item.member === member) &&
        (yearFilter === "All" || item.year === Number(yearFilter)) &&
        (quarterFilter === "All" || item.quarter === Number(quarterFilter)) &&
        (monthFilter === "All" || item.month === Number(monthFilter))
    );
  }, [enrichedData, department, member, yearFilter, quarterFilter, monthFilter]);

  const statistics = useMemo(() => {
    return filteredData.reduce(
      (result, item) => {
        const count = Number(item.count) || 0;
        result.total += count;
        if (item.status === "Pending") {
          result.pending += count;
        }
        if (item.status === "Completed") {
          result.completed += count;
        }
        if (item.status === "InProgress") {
          result.InProgress += count;
        }
        return result;
      },
      {
        total: 0,
        pending: 0,
        completed: 0,
        InProgress: 0
      }
    );
  }, [filteredData]);

  const groupedChartData = useMemo(() => {
    let groupField = "department";
    if (scope === "member") {
      groupField = "member";
    } else if (scope === "region") {
      groupField = "region";
    }

    const createChartData = type => {
      const result = {};
      filteredData
        .filter(item => item.type === type)
        .forEach(item => {
          const name = item[groupField] || "Unknown";
          if (!result[name]) {
            result[name] = {
              name,
              Pending: 0,
              Completed: 0,
              InProgress: 0
            };
          }
          const count = Number(item.count) || 0;
          if (item.status === "Pending") {
            result[name].Pending += count;
          }
          if (item.status === "Completed") {
            result[name].Completed += count;
          }
          if (item.status === "InProgress") {
            result[name].InProgress += count;
          }
        });
      return Object.values(result).sort(
        (a, b) => String(a.name).localeCompare(String(b.name))
      );
    };

    return {
      quotation: createChartData("Quotation"),
      policyIssuance: createChartData("Policy Issuance")
    };
  }, [filteredData, scope]);

  const chartMaxValue = useMemo(() => {
    const allRows = [
      ...groupedChartData.quotation,
      ...groupedChartData.policyIssuance
    ];
    const maximum = Math.max(
      0,
      ...allRows.map(
        item => item.Pending + item.Completed + item.InProgress
      )
    );
    if (maximum === 0) {
      return 5;
    }
    return Math.ceil(maximum * 1.15);
  }, [groupedChartData]);

  const handleDepartmentChange = event => {
    setDepartment(event.target.value);
    setMember("All");
  };

  const selectStyle = {
    minWidth: 100,
    height: 24,
    padding: "0 4px",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    background: "#fff",
    fontSize: "11px",
    cursor: "pointer"
  };

  return (
    <div
      style={{
        width: "100%"
      }}
    >
      {/* FILTER */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 12
        }}
      >
        <select
          value={scope}
          onChange={event => setScope(event.target.value)}
          style={selectStyle}
        >
          <option value="department">Xem theo Phòng ban (Department View)</option>
          <option value="member">Xem theo Nhân viên (Member View)</option>
          <option value="region">Xem theo Miền (Region View)</option>
        </select>

        {scope !== "region" && (
          <>
            <select
              value={department}
              onChange={handleDepartmentChange}
              style={selectStyle}
            >
              {departments.map(item => (
                <option key={item} value={item}>
                  {item === "All" ? "Tất cả phòng ban" : item}
                </option>
              ))}
            </select>

            <select
              value={member}
              onChange={event => setMember(event.target.value)}
              style={selectStyle}
            >
              {members.map(item => (
                <option key={item} value={item}>
                  {item === "All" ? "Tất cả nhân viên" : item}
                </option>
              ))}
            </select>
          </>
        )}

        {/* Time Filters */}
        <select
          value={yearFilter}
          onChange={e => setYearFilter(e.target.value)}
          style={selectStyle}
        >
          <option value="All">Tất cả các năm (All Years)</option>
          <option value="2025">Năm 2025</option>
          <option value="2026">Năm 2026</option>
        </select>

        <select
          value={quarterFilter}
          onChange={e => setQuarterFilter(e.target.value)}
          style={selectStyle}
        >
          <option value="All">Tất cả các quý (All Quarters)</option>
          <option value="1">Quý 1</option>
          <option value="2">Quý 2</option>
          <option value="3">Quý 3</option>
          <option value="4">Quý 4</option>
        </select>

        <select
          value={monthFilter}
          onChange={e => setMonthFilter(e.target.value)}
          style={selectStyle}
        >
          <option value="All">Tất cả các tháng (All Months)</option>
          {[...Array(12)].map((_, i) => (
            <option key={i + 1} value={i + 1}>{`Tháng ${i + 1}`}</option>
          ))}
        </select>
      </div>

      {/* KPI */}
<div

        style={{

          display: "grid",

          gridTemplateColumns:

            "repeat(auto-fit, minmax(140px, 1fr))",

          gap: 12,

          marginBottom: 12

        }}
>
  <Card

          title=""
value="Overview Workload"

        />
<Card

          title="Total"

          value={statistics.total}

        />
<Card

          title="Pending"

          value={statistics.pending}

        />
<Card

          title="Completed"

          value={statistics.completed}

        />
<Card

          title="InProgress"

          value={statistics.InProgress}

        />

</div>

      {/* CHART */}
<div

        style={{

          background: "#fff",

          borderRadius: 12,

          padding: 12,

          boxShadow:

            "0 1px 3px rgba(0,0,0,.1)"

        }}
>
<div

          style={{

            display: "flex",

            justifyContent:

              "space-between",

            alignItems: "center",

            gap: 12,

            marginBottom: 12,

            flexWrap: "wrap"

          }}
>
<div>
<div

              style={{

                fontSize: 12,

                fontWeight: 700

              }}
>

              Workload by status
</div>
<div

              style={{

                marginTop: 2,

                color: "#666",

                fontSize: 11

              }}
>

              {scope === "department"

                ? "Grouped by department"

                : "Grouped by member"}
</div>
</div>
<div

            style={{

              display: "flex",

              alignItems: "center",

              gap: 16,

              flexWrap: "wrap"

            }}
>
<LegendItem

              color="#fbbf24"

              label="Pending"

            />
<LegendItem

              color="#22c55e"

              label="Completed"

            />
<LegendItem

              color="#ef4444"

              label="InProgress"

            />
</div>
</div>
<div

          style={{

            display: "grid",

            gridTemplateColumns:

              "repeat(auto-fit, minmax(420px, 1fr))",

            gap: 16

          }}
>
<StatusChart

            title="Quotation"

            data={

              groupedChartData.quotation

            }

            background="#FFF8E1"

            yAxisMax={chartMaxValue}

          />
<StatusChart

            title="Policy Issuance"

            data={

              groupedChartData.policyIssuance

            }

            background="#EAF4FF"

            yAxisMax={chartMaxValue}

          />
</div>
</div>
</div>

  );

}
 