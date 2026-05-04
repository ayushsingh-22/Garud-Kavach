import React, { useEffect, useState } from "react";
import apiFetch from "../utils/apiFetch";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import "./Styles/Analytics.css";

const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF",
  "#D7263D", "#4A4E69", "#FF6F61", "#9B59B6", "#1F77B4",
  "#2CA02C", "#E74C3C", "#34495E", "#F1C40F", "#8E44AD",
  "#1ABC9C", "#C0392B", "#2ECC71", "#E67E22", "#BDC3C7"
];

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch("/api/analytics", {
      method: "GET",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch analytics");
        }
        return res.json();
      })
      .then((data) => {
        setAnalytics(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setError("Failed to load analytics.");
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="loading-message">Loading analytics...</p>;
  if (error) return <p className="error-message">{error}</p>;
  if (!analytics) return <p className="no-data-message">No data available.</p>;

  const { topServices = [], pieChartData = [], monthlyRevenue = [] } = analytics;

  return (
    <div className="analytics-container">
      <div className="analytics-grid">
        {/* Top Services */}
        <div className="analytics-card">
          <h2 className="card-title">Top 3 Services with Revenue</h2>
          <div className="card-content">
            {topServices.length === 0 ? (
              <p>No service data available.</p>
            ) : (
              <div className="top-services-medals">
                {topServices.map((item, index) => {
                  const maxRevenue = Math.max(...topServices.map(s => s.revenue));
                  const percentage = (item.revenue / maxRevenue) * 100;
                  
                  return (
                    <div key={index} className="service-medal">
                      <div className="medal-header">
                        <div className={`medal-rank rank-${index + 1}`}>{index + 1}</div>
                        <div className="medal-name">{item.service}</div>
                        <div className="medal-revenue">₹{item.revenue.toLocaleString('en-IN')}</div>
                      </div>
                      <div className="medal-progress-container">
                        <div 
                          className="medal-progress" 
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: COLORS[index % COLORS.length]
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="analytics-card">
          <h2 className="card-title">Pie Chart (Revenue by Service)</h2>
          <div className="card-content">
            {pieChartData.length === 0 ? (
              <p>No data for pie chart.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="analytics-card">
          <h2 className="card-title">Bar Chart (Revenue by Month & Year)</h2>
          <div className="card-content">
            {monthlyRevenue.length === 0 ? (
              <p>No monthly revenue data.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyRevenue}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill={COLORS[4]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Line Chart */}
        <div className="analytics-card">
          <h2 className="card-title">Growth Trend (% Change Month/Mo)</h2>
          <div className="card-content">
            {monthlyRevenue.length === 0 ? (
              <p>No growth data.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyRevenue}>
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(tick) => `${tick}%`} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="growth" stroke={COLORS[5]} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
