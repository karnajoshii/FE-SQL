
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
  
  if (count > colors.length) {
    return [...colors, ...colors.map(color => color + '99')].slice(0, count);
  }
  
  return colors.slice(0, count);
};

const ChartComponents = ({ visualization }) => {
  if (!visualization) {
    console.error('No visualization provided');
    return <div className="text-red-500 p-2">No visualization data available</div>;
  }

  if (!visualization.data || !Array.isArray(visualization.data) || visualization.data.length === 0) {
    console.error('Invalid or empty visualization data', visualization);
    return <div className="text-red-500 p-2">Invalid chart data</div>;
  }

  console.log('Rendering chart with data:', visualization);

  const data = visualization.data;
  const chartType = visualization.type;
  
  // Get keys from the first data item
  const keys = Object.keys(data[0]);
  
  // Determine if we have x/y format or named keys format
  const isXYFormat = keys.includes('x') && keys.includes('y');
  
  // If we have x/y format but also have x_axis/y_axis labels, transform the data
  let processedData = data;
  if (isXYFormat && (visualization.x_axis || visualization.y_axis)) {
    processedData = data.map(item => ({
      [visualization.x_axis || 'xValue']: item.x,
      [visualization.y_axis || 'yValue']: item.y
    }));
  }

  // After potential transformation, get the keys again
  const dataKeys = Object.keys(processedData[0]);

  const categoryKeys = dataKeys.filter(key => {
    const firstValue = processedData[0][key];
    return typeof firstValue === 'string' || isNaN(parseFloat(firstValue));
  });

  const valueKeys = dataKeys.filter(key => {
    const firstValue = processedData[0][key];
    return typeof firstValue === 'number' || !isNaN(parseFloat(firstValue));
  });

  // Determine data keys based on visualization props or data structure
  const dataKey = visualization.x_axis || 
    (isXYFormat ? visualization.x_axis || 'xValue' : 
      dataKeys.includes('Vehicle Size') ? 'Vehicle Size' : categoryKeys[0] || dataKeys[0]);

  const valueKey = visualization.y_axis || 
    (isXYFormat ? visualization.y_axis || 'yValue' : 
      dataKeys.includes('Total Claim Amount') ? 'Total Claim Amount' : valueKeys[0] || dataKeys[1] || dataKeys[0]);

  const colors = generateColors(processedData.length);

  switch (chartType) {
    case 'bar':
      return (
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={processedData} margin={{ top: 5, right: 30, left: 20, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={dataKey} angle={-45} textAnchor="end" height={70} />
              <YAxis />
              <Tooltip formatter={(value) => typeof value === 'number' ? value.toLocaleString() : value} />
              <Legend />
              <Bar dataKey={valueKey} fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );

    case 'pie':
      return (
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 5, right: 30, left: 20, bottom: 50 }}>
              <Pie
                data={processedData}
                cx="50%"
                cy="50%"
                outerRadius="80%"
                labelLine={true}
                label={({ name }) => name}
                fill="#8884d8"
                dataKey={valueKey}
                nameKey={dataKey}
              >
                {processedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => typeof value === 'number' ? value.toLocaleString() : value} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      );

    case 'line':
      return (
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={processedData} margin={{ top: 5, right: 30, left: 20, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={dataKey} angle={-45} textAnchor="end" height={70} />
              <YAxis />
              <Tooltip formatter={(value) => typeof value === 'number' ? value.toLocaleString() : value} />
              <Legend />
              <Line type="monotone" dataKey={valueKey} stroke="#8884d8" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      );

    case 'scatter':
      const scatterXKey = visualization.x_axis || (isXYFormat ? 'xValue' : valueKeys[0] || dataKeys[0]);
      const scatterYKey = visualization.y_axis || (isXYFormat ? 'yValue' : (valueKeys.length > 1 ? valueKeys[1] : valueKeys[0]));

      return (
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 5, right: 30, left: 20, bottom: 50 }}>
              <CartesianGrid />
              <XAxis dataKey={scatterXKey} name={visualization.x_label || scatterXKey} />
              <YAxis dataKey={scatterYKey} name={visualization.y_label || scatterYKey} />
              <Tooltip formatter={(value) => typeof value === 'number' ? value.toLocaleString() : value} />
              <Legend />
              <Scatter name="Data Points" data={processedData} fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
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































// Below  code is working fine for the mulitple chart types

// 'use client';

// import React from 'react';
// import {
//   BarChart, Bar, PieChart, Pie, LineChart, Line, ScatterChart, Scatter,
//   XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
// } from 'recharts';

// // Generate random colors for chart elements
// const generateColors = (count) => {
//   const colors = [
//     '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', 
//     '#FFBB28', '#FF8042', '#a4de6c', '#d0ed57', '#83a6ed', '#8dd1e1'
//   ];
  
//   if (count > colors.length) {
//     return [...colors, ...colors.map(color => color + '99')].slice(0, count);
//   }
  
//   return colors.slice(0, count);
// };

// const ChartComponents = ({ visualization }) => {
//   if (!visualization) {
//     console.error('No visualization provided');
//     return <div className="text-red-500 p-2">No visualization data available</div>;
//   }

//   if (!visualization.data || !Array.isArray(visualization.data) || visualization.data.length === 0) {
//     console.error('Invalid or empty visualization data', visualization);
//     return <div className="text-red-500 p-2">Invalid chart data</div>;
//   }

//   console.log('Rendering chart with data:', visualization);

//   const data = visualization.data;
//   const chartType = visualization.type;
//   const isGrouped = visualization.group_by && data[0]?.groups;

//   if (chartType === 'bar' && isGrouped) {
//     // Handle grouped bar chart
//     const groupNames = [...new Set(data.flatMap(item => item.groups.map(g => g.group)))];
//     const colors = generateColors(groupNames.length);

//     const chartData = data.map(item => {
//       const entry = { [visualization.x_axis || 'xValue']: item.x };
//       item.groups.forEach(group => {
//         entry[group.group] = group.y;
//       });
//       return entry;
//     });

//     return (
//       <div className="w-full h-[300px]">
//         <ResponsiveContainer width="100%" height="100%">
//           <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 50 }}>
//             <CartesianGrid strokeDasharray="3 3" />
//             <XAxis 
//               dataKey={visualization.x_axis || 'xValue'} 
//               angle={-45} 
//               textAnchor="end" 
//               height={70} 
//               label={{ value: visualization.x_label || visualization.x_axis, position: 'insideBottom', offset: -10 }}
//             />
//             <YAxis 
//               label={{ value: visualization.y_label || visualization.y_axis, angle: -90, position: 'insideLeft' }}
//             />
//             <Tooltip formatter={(value) => typeof value === 'number' ? value.toLocaleString() : value} />
//             <Legend />
//             {groupNames.map((group, index) => (
//               <Bar 
//                 key={group} 
//                 dataKey={group} 
//                 fill={colors[index % colors.length]} 
//                 name={group}
//               />
//             ))}
//           </BarChart>
//         </ResponsiveContainer>
//       </div>
//     );
//   }

//   // Existing logic for non-grouped charts
//   const keys = Object.keys(data[0]);
//   const isXYFormat = keys.includes('x') && keys.includes('y');
  
//   let processedData = data;
//   if (isXYFormat && (visualization.x_axis || visualization.y_axis)) {
//     processedData = data.map(item => ({
//       [visualization.x_axis || 'xValue']: item.x,
//       [visualization.y_axis || 'yValue']: item.y
//     }));
//   }

//   const dataKeys = Object.keys(processedData[0]);

//   const categoryKeys = dataKeys.filter(key => {
//     const firstValue = processedData[0][key];
//     return typeof firstValue === 'string' || isNaN(parseFloat(firstValue));
//   });

//   const valueKeys = dataKeys.filter(key => {
//     const firstValue = processedData[0][key];
//     return typeof firstValue === 'number' || !isNaN(parseFloat(firstValue));
//   });

//   const dataKey = visualization.x_axis || 
//     (isXYFormat ? visualization.x_axis || 'xValue' : 
//       dataKeys.includes('Vehicle Size') ? 'Vehicle Size' : categoryKeys[0] || dataKeys[0]);

//   const valueKey = visualization.y_axis || 
//     (isXYFormat ? visualization.y_axis || 'yValue' : 
//       dataKeys.includes('Total Claim Amount') ? 'Total Claim Amount' : valueKeys[0] || dataKeys[1] || dataKeys[0]);

//   const colors = generateColors(processedData.length);

//   switch (chartType) {
//     case 'bar':
//       return (
//         <div className="w-full h-[300px]">
//           <ResponsiveContainer width="100%" height="100%">
//             <BarChart data={processedData} margin={{ top: 5, right: 30, left: 20, bottom: 50 }}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis 
//                 dataKey={dataKey} 
//                 angle={-45} 
//                 textAnchor="end" 
//                 height={70} 
//                 label={{ value: visualization.x_label || dataKey, position: 'insideBottom', offset: -10 }}
//               />
//               <YAxis 
//                 label={{ value: visualization.y_label || valueKey, angle: -90, position: 'insideLeft' }}
//               />
//               <Tooltip formatter={(value) => typeof value === 'number' ? value.toLocaleString() : value} />
//               <Legend />
//               <Bar dataKey={valueKey} fill="#8884d8" />
//             </BarChart>
//           </ResponsiveContainer>
//         </div>
//       );

//     case 'pie':
//       return (
//         <div className="w-full h-[300px]">
//           <ResponsiveContainer width="100%" height="100%">
//             <PieChart margin={{ top: 5, right: 30, left: 20, bottom: 50 }}>
//               <Pie
//                 data={processedData}
//                 cx="50%"
//                 cy="50%"
//                 outerRadius="80%"
//                 labelLine={true}
//                 label={({ name }) => name}
//                 fill="#8884d8"
//                 dataKey={valueKey}
//                 nameKey={dataKey}
//               >
//                 {processedData.map((entry, index) => (
//                   <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
//                 ))}
//               </Pie>
//               <Tooltip formatter={(value) => typeof value === 'number' ? value.toLocaleString() : value} />
//               <Legend />
//             </PieChart>
//           </ResponsiveContainer>
//         </div>
//       );

//     case 'line':
//       return (
//         <div className="w-full h-[300px]">
//           <ResponsiveContainer width="100%" height="100%">
//             <LineChart data={processedData} margin={{ top: 5, right: 30, left: 20, bottom: 50 }}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis 
//                 dataKey={dataKey} 
//                 angle={-45} 
//                 textAnchor="end" 
//                 height={70} 
//                 label={{ value: visualization.x_label || dataKey, position: 'insideBottom', offset: -10 }}
//               />
//               <YAxis 
//                 label={{ value: visualization.y_label || valueKey, angle: -90, position: 'insideLeft' }}
//               />
//               <Tooltip formatter={(value) => typeof value === 'number' ? value.toLocaleString() : value} />
//               <Legend />
//               <Line type="monotone" dataKey={valueKey} stroke="#8884d8" activeDot={{ r: 8 }} />
//             </LineChart>
//           </ResponsiveContainer>
//         </div>
//       );

//     case 'scatter':
//       const scatterXKey = visualization.x_axis || (isXYFormat ? 'xValue' : valueKeys[0] || dataKeys[0]);
//       const scatterYKey = visualization.y_axis || (isXYFormat ? 'yValue' : (valueKeys.length > 1 ? valueKeys[1] : valueKeys[0]));

//       return (
//         <div className="w-full h-[300px]">
//           <ResponsiveContainer width="100%" height="100%">
//             <ScatterChart margin={{ top: 5, right: 30, left: 20, bottom: 50 }}>
//               <CartesianGrid />
//               <XAxis 
//                 dataKey={scatterXKey} 
//                 name={visualization.x_label || scatterXKey} 
//                 label={{ value: visualization.x_label || scatterXKey, position: 'insideBottom', offset: -10 }}
//               />
//               <YAxis 
//                 dataKey={scatterYKey} 
//                 name={visualization.y_label || scatterYKey} 
//                 label={{ value: visualization.y_label || scatterYKey, angle: -90, position: 'insideLeft' }}
//               />
//               <Tooltip formatter={(value) => typeof value === 'number' ? value.toLocaleString() : value} />
//               <Legend />
//               <Scatter name="Data Points" data={processedData} fill="#8884d8" />
//             </ScatterChart>
//           </ResponsiveContainer>
//         </div>
//       );

//     default:
//       return (
//         <div className="p-4 bg-yellow-50 border border-yellow-100 rounded text-yellow-700">
//           Unknown chart type: {chartType}
//         </div>
//       );
//   }
// };

// export default ChartComponents;





