'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Card, Spinner } from 'react-bootstrap';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ComplaintTrendsChartProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      color: string;
    }[];
  };
  isLoading?: boolean;
  title?: string;
}

const ComplaintTrendsChart: React.FC<ComplaintTrendsChartProps> = ({
  data,
  isLoading = false,
  title = 'Complaint Trends',
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

  const chartData = {
    labels: data.labels,
    datasets: data.datasets.map((dataset, index) => ({
      label: dataset.label,
      data: dataset.data,
      borderColor: dataset.color,
      backgroundColor: dataset.color + '20', // Semi-transparent
      fill: true,
      tension: 0.4,
      pointBackgroundColor: dataset.color,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: function(context: any) {
            return context[0].label;
          },
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time Period',
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Number of Complaints',
        },
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <Card className="h-100">
      <Card.Header>
        <h6 className="mb-0">{title}</h6>
      </Card.Header>
      <Card.Body>
        {data.labels.length === 0 ? (
          <div className="d-flex align-items-center justify-content-center h-100 text-muted">
            <div className="text-center">
              <p>No data available</p>
            </div>
          </div>
        ) : (
          <div className="chart-container">
            <Line data={chartData} options={options} />
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default ComplaintTrendsChart;

