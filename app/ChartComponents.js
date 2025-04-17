'use client';

import React from 'react';
import {
  BarChart, Bar, PieChart, Pie, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

// Generate random colors for chart elements
const generateColors = (count) => {
  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', 
    '#FFBB28', '#FF8042', '#a4de6c', '#d0ed57', '#83a6ed', '#8dd1e1'
  ];
  
  // If we need more colors than available, repeat with variations
  if (count > colors.length) {
    return [...colors, ...colors.map(color => color + '99')].slice(0, count);
  }
  
  return colors.slice(0, count);
};

// Component to render the appropriate chart based on visualization data
const ChartComponents = ({ visualization }) => {
  // Add more robust error handling
  if (!visualization) {
    console.error('No visualization provided');
    return <div className="text-red-500 p-2">No visualization data available</div>;
  }

  if (!visualization.data || !Array.isArray(visualization.data) || visualization.data.length === 0) {
    console.error('Invalid or empty visualization data', visualization);
    return <div className="text-red-500 p-2">Invalid chart data</div>;
  }

  // Log the data for debugging
  console.log('Rendering chart with data:', visualization);

  const data = visualization.data;
  const chartType = visualization.type;
  
  // Extract keys for axes - identify category and value columns
  const keys = Object.keys(data[0]);
  
  // Find a key that likely represents a category (non-numeric)
  const categoryKeys = keys.filter(key => {
    // Check if the first item's value for this key is not a number
    const firstValue = data[0][key];
    return typeof firstValue === 'string' || isNaN(parseFloat(firstValue));
  });
  
  // Find keys that likely represent numeric values
  const valueKeys = keys.filter(key => {
    // Check if the first item's value for this key is a number
    const firstValue = data[0][key];
    return typeof firstValue === 'number' || !isNaN(parseFloat(firstValue));
  });
  
  // Select dataKey (x-axis) and valueKey (y-axis)
  // Use explicit keys if provided, otherwise infer from data
  const dataKey = visualization.xAxis || 
                 (keys.includes('Vehicle Size') ? 'Vehicle Size' : 
                  categoryKeys[0] || keys[0]);
                 
  const valueKey = visualization.yAxis || 
                  (keys.includes('Total Claim Amount') ? 'Total Claim Amount' : 
                   valueKeys[0] || keys[1] || keys[0]);
  
  // Generate colors for chart elements
  const colors = generateColors(data.length);

  switch (chartType) {
    case 'bar':
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey={dataKey}
              angle={-45} 
              textAnchor="end"
              height={70}
            />
            <YAxis />
            <Tooltip formatter={(value) => typeof value === 'number' ? value.toLocaleString() : value} />
            <Legend />
            <Bar dataKey={valueKey} fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      );
      
    case 'pie':
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={({name}) => name}
              outerRadius={100}
              fill="#8884d8"
              dataKey={valueKey}
              nameKey={dataKey}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => typeof value === 'number' ? value.toLocaleString() : value} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
      
    case 'line':
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey={dataKey}
              angle={-45} 
              textAnchor="end"
              height={70}
            />
            <YAxis />
            <Tooltip formatter={(value) => typeof value === 'number' ? value.toLocaleString() : value} />
            <Legend />
            <Line type="monotone" dataKey={valueKey} stroke="#8884d8" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      );
      
    case 'scatter':
      // For scatter, try to use two numeric columns if available
      const scatterXKey = visualization.xAxis || valueKeys[0] || keys[0];
      const scatterYKey = visualization.yAxis || (valueKeys.length > 1 ? valueKeys[1] : valueKeys[0]);
      
      return (
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 5, right: 30, left: 20, bottom: 50 }}>
            <CartesianGrid />
            <XAxis 
              dataKey={scatterXKey}
              name={scatterXKey}
            />
            <YAxis 
              dataKey={scatterYKey}
              name={scatterYKey}
            />
            <Tooltip formatter={(value) => typeof value === 'number' ? value.toLocaleString() : value} />
            <Legend />
            <Scatter 
              name="Data Points" 
              data={data} 
              fill="#8884d8" 
            />
          </ScatterChart>
        </ResponsiveContainer>
      );
      
    default:
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-100 rounded text-yellow-700">
          Unknown chart type: {chartType}
        </div>
      );
  }
};

export default ChartComponents;