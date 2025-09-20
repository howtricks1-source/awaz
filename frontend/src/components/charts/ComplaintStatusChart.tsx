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
import { Bar, Pie } from 'react-chartjs-2';
import { Card, Spinner } from 'react-bootstrap';
import { ComplaintStatus } from '@/types';
import { getStatusColor } from '@/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ComplaintStatusChartProps {
  data: Record<ComplaintStatus, number>;
  isLoading?: boolean;
  type?: 'bar' | 'pie';
  title?: string;
}

const ComplaintStatusChart: React.FC<ComplaintStatusChartProps> = ({
  data,
  isLoading = false,
  type = 'pie',
  title = 'Complaints by Status',
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

  const labels = Object.keys(data) as ComplaintStatus[];
  const values = Object.values(data);

  // Map status to Bootstrap colors
  const statusColors: Record<ComplaintStatus, string> = {
    'Pending': '#ffc107',
    'In Progress': '#0dcaf0',
    'Resolved': '#198754',
    'Rejected': '#dc3545',
    'Not Resolved': '#6c757d',
    'Closed': '#212529',
  };

  const backgroundColors = labels.map(status => statusColors[status]);
  const borderColors = labels.map(status => statusColors[status]);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Number of Complaints',
        data: values,
        backgroundColor: type === 'bar' 
          ? backgroundColors.map(color => color + '80') // Semi-transparent for bar chart
          : backgroundColors,
        borderColor: borderColors,
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: type === 'pie' ? 'right' as const : 'top' as const,
        display: type === 'pie',
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
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
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
        {labels.length === 0 || values.every(v => v === 0) ? (
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
              <Pie data={chartData} options={options} />
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default ComplaintStatusChart;

