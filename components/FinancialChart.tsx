
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FinancialMetric } from '../types';

interface FinancialChartProps {
  metrics: FinancialMetric[];
  currency: string;
}

/**
 * Custom Tick component with precisely controlled vertical spacing.
 * Positions the labels with a clear gap below the zero-line (baseline).
 */
const MultiLineTick = (props: any) => {
  const { x, y, payload } = props;
  const value = payload.value;
  
  // Splitting logic for labels to keep them compact and readable
  let lines = [];
  if (value.includes('Net Profit')) {
    lines = ['Net Profit', '(Profit after taxes)'];
  } else if (value === 'Total Liabilities') {
    lines = ['Total', 'Liabilities'];
  } else if (value === 'Total Assets') {
    lines = ['Total', 'Assets'];
  } else if (value.length > 12 && value.includes(' ')) {
    const index = value.indexOf(' ');
    lines = [value.substring(0, index), value.substring(index + 1)];
  } else {
    lines = [value];
  }

  return (
    <g transform={`translate(${x},${y})`}>
      {/* 
        y=15 provides the "gap" from the 'lambi line' (axis baseline).
        The text starts 15px below the zero line.
      */}
      <text
        x={0}
        y={15} 
        textAnchor="middle"
        fill="#64748b"
        fontSize={11}
        fontWeight={700}
        className="font-sans"
      >
        {lines.map((line: string, index: number) => (
          <tspan x={0} dy={index === 0 ? 0 : 14} key={index}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
};

const FinancialChart: React.FC<FinancialChartProps> = ({ metrics = [], currency }) => {
  const safeMetrics = Array.isArray(metrics) ? metrics : [];

  const displayOrder = [
    'Total Assets',
    'Total Liabilities',
    'Revenue',
    'Net Profit (Profit after taxes)'
  ];

  const chartData = displayOrder.map(targetLabel => {
    const found = safeMetrics.find(m => {
      const labelStr = m?.label || '';
      return labelStr.toLowerCase().includes(targetLabel.split(' ')[0].toLowerCase());
    });
    
    return found ? { ...found, label: targetLabel } : { 
      label: targetLabel, 
      current_year: 0, 
      previous_year: 0, 
      unit: '' 
    };
  });

  return (
    <div className="w-full flex flex-col bg-white">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-blue-50 p-2 rounded-lg">
          <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-900 tracking-tight">
          Comparative Analysis ({currency})
        </h3>
      </div>
      
      <div className="h-[320px] w-full"> 
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 10 }} 
            barGap={8}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} horizontal={true} />
            
            <XAxis 
              dataKey="label" 
              axisLine={{ stroke: '#cbd5e1', strokeWidth: 1.5 }} 
              tickLine={false} 
              interval={0}
              height={80} 
              tick={<MultiLineTick />}
            />
            
            <YAxis 
              axisLine={{ stroke: '#cbd5e1', strokeWidth: 1.5 }}
              tickLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickFormatter={(val) => {
                if (val === 0) return "0";
                if (Math.abs(val) >= 1.0e+9) return (val / 1.0e+9).toFixed(1) + "B";
                if (Math.abs(val) >= 1.0e+6) return (val / 1.0e+6).toFixed(0) + "M";
                return val.toLocaleString();
              }}
              width={50}
            />
            
            <Tooltip 
              cursor={{ fill: '#f8fafc', opacity: 0.6 }}
              contentStyle={{ 
                borderRadius: '12px', 
                border: '1px solid #e2e8f0', 
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                fontSize: '11px',
                fontWeight: '600'
              }}
              formatter={(value: number) => [new Intl.NumberFormat('en-US').format(value), '']}
            />
            
            <Legend 
              verticalAlign="bottom" 
              align="center"
              iconType="circle"
              height={30}
              wrapperStyle={{ 
                paddingTop: '10px',
                fontSize: '11px',
                fontWeight: 700
              }}
              formatter={(value) => <span className="text-slate-600 mx-1">{value}</span>}
            />
            
            <Bar 
              name="Current Year" 
              dataKey="current_year" 
              fill="#2563eb"  /* Professional Blue */
              barSize={28}
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              name="Previous Year" 
              dataKey="previous_year" 
              fill="#94a3b8"  /* Neutral Grey */
              barSize={28}
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FinancialChart;
