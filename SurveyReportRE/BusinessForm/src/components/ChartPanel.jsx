import { useMemo, useState } from "react";

import {

  ResponsiveContainer,

  BarChart,

  Bar,

  XAxis,

  YAxis,

  Tooltip,

  CartesianGrid

} from "recharts";

function Card({ title, value }) {

  return (
<div

      style={{

        background: "#fff",

        padding: 16,

        borderRadius: 12,

        boxShadow: "0 1px 3px rgba(0,0,0,.1)"

      }}
>
<div

        style={{

          color: "#666",

          marginBottom: 8

        }}
>

        {title}
</div>
<div

        style={{

          fontSize: 28,

          fontWeight: 700

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

        fontSize: 13

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

        padding: "16px 12px 12px"

      }}
>
<div

        style={{

          marginBottom: 12,

          textAlign: "center",

          fontSize: 16,

          fontWeight: 700

        }}
>

        {title}
</div>
<div

        style={{

          height: 480

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

                bottom: 55

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

                height={70}

              />
<YAxis

                domain={[0, yAxisMax]}

                allowDecimals={false}

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

                fill="#fbbf24"

              />
<Bar

                dataKey="Completed"

                stackId="status"

                fill="#22c55e"

              />
<Bar

                dataKey="Rejected"

                stackId="status"

                fill="#ef4444"

                radius={[4, 4, 0, 0]}

              />
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

export default function ChartPanel({

  data = []

}) {

  const [scope, setScope] =

    useState("department");

  const [department, setDepartment] =

    useState("All");

  const [member, setMember] =

    useState("All");

  const departments = useMemo(() => {

    return [

      "All",

      ...new Set(

        data

          .map(item => item.department)

          .filter(Boolean)

      )

    ];

  }, [data]);

  const members = useMemo(() => {

    const rows = data.filter(

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

  }, [data, department]);

  const filteredData = useMemo(() => {

    return data.filter(

      item =>

        (department === "All" ||

          item.department === department) &&

        (member === "All" ||

          item.member === member)

    );

  }, [data, department, member]);

  const statistics = useMemo(() => {

    return filteredData.reduce(

      (result, item) => {

        const count =

          Number(item.count) || 0;

        result.total += count;

        if (item.status === "Pending") {

          result.pending += count;

        }

        if (item.status === "Completed") {

          result.completed += count;

        }

        if (item.status === "Rejected") {

          result.rejected += count;

        }

        return result;

      },

      {

        total: 0,

        pending: 0,

        completed: 0,

        rejected: 0

      }

    );

  }, [filteredData]);

  const groupedChartData = useMemo(() => {

    const groupField =

      scope === "department"

        ? "department"

        : "member";

    const createChartData = type => {

      const result = {};

      filteredData

        .filter(item => item.type === type)

        .forEach(item => {

          const name =

            item[groupField] || "Unknown";

          if (!result[name]) {

            result[name] = {

              name,

              Pending: 0,

              Completed: 0,

              Rejected: 0

            };

          }

          const count =

            Number(item.count) || 0;

          if (item.status === "Pending") {

            result[name].Pending += count;

          }

          if (item.status === "Completed") {

            result[name].Completed += count;

          }

          if (item.status === "Rejected") {

            result[name].Rejected += count;

          }

        });

      return Object.values(result).sort(

        (a, b) =>

          String(a.name).localeCompare(

            String(b.name)

          )

      );

    };

    return {

      quotation: createChartData(

        "Quotation"

      ),

      policyIssuance: createChartData(

        "Policy Issuance"

      )

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

        item =>

          item.Pending +

          item.Completed +

          item.Rejected

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

          gap: 12,

          flexWrap: "wrap",

          marginBottom: 20

        }}
>
<select

          value={scope}

          onChange={event =>

            setScope(event.target.value)

          }

          style={{

            minWidth: 180,

            height: 38,

            padding: "0 10px",

            border: "1px solid #d1d5db",

            borderRadius: 8,

            background: "#fff"

          }}
>
<option value="department">

            Department View
</option>
<option value="member">

            Member View
</option>
</select>
<select

          value={department}

          onChange={

            handleDepartmentChange

          }

          style={{

            minWidth: 180,

            height: 38,

            padding: "0 10px",

            border: "1px solid #d1d5db",

            borderRadius: 8,

            background: "#fff"

          }}
>

          {departments.map(item => (
<option

              key={item}

              value={item}
>

              {item === "All"

                ? "All Department"

                : item}
</option>

          ))}
</select>
<select

          value={member}

          onChange={event =>

            setMember(event.target.value)

          }

          style={{

            minWidth: 180,

            height: 38,

            padding: "0 10px",

            border: "1px solid #d1d5db",

            borderRadius: 8,

            background: "#fff"

          }}
>

          {members.map(item => (
<option

              key={item}

              value={item}
>

              {item === "All"

                ? "All Member"

                : item}
</option>

          ))}
</select>
</div>

      {/* KPI */}
<div

        style={{

          display: "grid",

          gridTemplateColumns:

            "repeat(auto-fit, minmax(180px, 1fr))",

          gap: 16,

          marginBottom: 24

        }}
>
  <h1>Workloads</h1>
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

          title="Rejected"

          value={statistics.rejected}

        />

</div>

      {/* CHART */}
<div

        style={{

          background: "#fff",

          borderRadius: 12,

          padding: 20,

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

            gap: 16,

            marginBottom: 16,

            flexWrap: "wrap"

          }}
>
<div>
<div

              style={{

                fontSize: 18,

                fontWeight: 700

              }}
>

              Workload by status
</div>
<div

              style={{

                marginTop: 4,

                color: "#666",

                fontSize: 13

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

              label="Rejected"

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
 