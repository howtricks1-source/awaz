'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Card, Spinner } from 'react-bootstrap';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ComplaintsByDepartmentChartProps {
  data: Record<string, number>;
  isLoading?: boolean;
  type?: 'bar' | 'doughnut';
  title?: string;
}

const ComplaintsByDepartmentChart: React.FC<ComplaintsByDepartmentChartProps> = ({
  data,
  isLoading = false,
  type = 'bar',
  title = 'Complaints by Department',
}) => {
  if (isLoading) {
    return (
      <Card className="h-100">
        <Card.Header>
          <h6 className="mb-0">{title}</h6>
        </Card.Header>
        <Card.Body className="d-flex align-items-center justify-content-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading chart...</span>
          </Spinner>
        </Card.Body>
      </Card>
    );
  }

  const labels = Object.keys(data);
  const values = Object.values(data);

  const colors = [
    '#0d6efd', '#6f42c1', '#d63384', '#dc3545', '#fd7e14',
    '#ffc107', '#198754', '#20c997', '#0dcaf0', '#6c757d'
  ];

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Number of Complaints',
        data: values,
        backgroundColor: type === 'bar' 
          ? colors[0] + '80' // Semi-transparent for bar chart
          : colors.slice(0, labels.length),
        borderColor: type === 'bar' 
          ? colors[0]
          : colors.slice(0, labels.length),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: type === 'doughnut' ? 'right' as const : 'top' as const,
        display: type === 'doughnut',
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed.y || context.parsed;
            const total = values.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
    scales: type === 'bar' ? {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    } : undefined,
  };

  return (
    <Card className="h-100">
      <Card.Header>
        <h6 className="mb-0">{title}</h6>
      </Card.Header>
      <Card.Body>
        {labels.length === 0 ? (
          <div className="d-flex align-items-center justify-content-center h-100 text-muted">
            <div className="text-center">
              <p>No data available</p>
            </div>
          </div>
        ) : (
          <div className="chart-container">
            {type === 'bar' ? (
              <Bar data={chartData} options={options} />
            ) : (
              <Doughnut data={chartData} options={options} />
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default ComplaintsByDepartmentChart;

