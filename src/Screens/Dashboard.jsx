import React, { useEffect, useState } from "react";
import Analytics from "./Analytics";
import "./Styles/Dashboard.css";
import baseURL from "../Constants/BaseURL"; 

const getStatusColor = (status) => {
  switch (status) {
    case "Resolved":
      return "#4CAF50";
    case "In Progress":
      return "#FF9800";
    case "Rejected":
      return "#F44336";
    case "Pending":
    default:
      return "#9E9E9E";
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case "Resolved":
      return "✓";
    case "In Progress":
      return "⏳";
    case "Rejected":
      return "✗";
    case "Pending":
    default:
      return "⏸";
  }
};

// Helper to format date and time in 12-hour format
const formatDateTime = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  const options = {
    year: "numeric",
    month: "short",
    day: "2-digit",
  };
  const dateStr = date.toLocaleDateString(undefined, options);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const timeStr = `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
  return `${dateStr}, ${timeStr}`;
};

const PAGE_SIZE = 10; // Number of queries per page

const Dashboard = () => {
  const [queries, setQueries] = useState([]);
  const [filteredQueries, setFilteredQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [serviceFilter, setServiceFilter] = useState("All");
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [selectedQueries, setSelectedQueries] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [notification, setNotification] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${baseURL}/api/getAllQueries`, {
      headers: { "Authorization": `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        // Sort by submitted_at descending (latest first)
        const sorted = [...data].sort(
          (a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)
        );
        setQueries(sorted);
        setFilteredQueries(sorted);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error:", err);
        setLoading(false);
        showNotification("Failed to load queries", "error");
      });
  }, []);

  // Filter and search functionality
  useEffect(() => {
    let filtered = queries;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(query =>
        query.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        query.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        query.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
        query.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "All") {
      filtered = filtered.filter(query => query.status === statusFilter);
    }

    // Service filter
    if (serviceFilter !== "All") {
      filtered = filtered.filter(query => query.service === serviceFilter);
    }

    setFilteredQueries(filtered);
  }, [queries, searchTerm, statusFilter, serviceFilter]);

  const handleStatusChange = (id, newStatus) => {
    const token = localStorage.getItem("token");
    fetch(`${baseURL}/api/updateStatus`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ id, status: newStatus }),
    })
      .then((res) => res.json())
      .then(() => {
        setQueries((prev) =>
          prev.map((q) => (q.id === id ? { ...q, status: newStatus } : q))
        );
        showNotification(`Status updated to ${newStatus}`, "success");
      })
      .catch((err) => {
        console.error("Error updating status:", err);
        showNotification("Failed to update status", "error");
      });
  };

  const handleBulkStatusChange = (newStatus) => {
    const selectedIds = Array.from(selectedQueries);
    Promise.all(
      selectedIds.map(id =>
        fetch(`${baseURL}/api/updateStatus`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ id, status: newStatus }),
        })
      )
    )
      .then(() => {
        setQueries((prev) =>
          prev.map((q) => 
            selectedIds.includes(q.id) ? { ...q, status: newStatus } : q
          )
        );
        setSelectedQueries(new Set());
        setShowBulkActions(false);
        showNotification(`${selectedIds.length} queries updated to ${newStatus}`, "success");
      })
      .catch((err) => {
        console.error("Error updating bulk status:", err);
        showNotification("Failed to update queries", "error");
      });
  };

  const toggleRowExpansion = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const toggleQuerySelection = (id) => {
    const newSelected = new Set(selectedQueries);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedQueries(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const selectAllQueries = () => {
    const allIds = new Set(filteredQueries.map(q => q.id));
    setSelectedQueries(allIds);
    setShowBulkActions(true);
  };

  const clearSelection = () => {
    setSelectedQueries(new Set());
    setShowBulkActions(false);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    const sorted = [...filteredQueries].sort((a, b) => {
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    setFilteredQueries(sorted);
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const getUniqueServices = () => {
    return [...new Set(queries.map(q => q.service))];
  };

  const getStatusStats = () => {
    const stats = {
      total: queries.length,
      pending: queries.filter(q => q.status === "Pending").length,
      inProgress: queries.filter(q => q.status === "In Progress").length,
      resolved: queries.filter(q => q.status === "Resolved").length,
      rejected: queries.filter(q => q.status === "Rejected").length,
    };
    return stats;
  };

  const stats = getStatusStats();

  // Calculate paginated queries
  const totalPages = Math.ceil(filteredQueries.length / PAGE_SIZE);
  const paginatedQueries = filteredQueries.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Reset to page 1 if filters/search change and currentPage is out of range
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [filteredQueries, totalPages, currentPage]);

  return (
    <div className="dashboard-container dark-mode">
      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="dashboard-header">
        <h1>Admin Portal</h1>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-card pending">
            <span className="stat-number">{stats.pending}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat-card in-progress">
            <span className="stat-number">{stats.inProgress}</span>
            <span className="stat-label">In Progress</span>
          </div>
          <div className="stat-card resolved">
            <span className="stat-number">{stats.resolved}</span>
            <span className="stat-label">Resolved</span>
          </div>
        </div>
      </div>

      {/* Centered Capsule Toggle */}
      <div className="toggle-container">
        <div className="capsule-toggle">
          <button
            className={`toggle-btn ${!showAnalytics ? "active" : ""}`}
            onClick={() => setShowAnalytics(false)}
          >
            Dashboard
          </button>
          <button
            className={`toggle-btn ${showAnalytics ? "active" : ""}`}
            onClick={() => setShowAnalytics(true)}
          >
            Analytics
          </button>
        </div>
      </div>

      {/* Display Analytics or Dashboard based on state */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading queries...</p>
        </div>
      ) : showAnalytics ? (
        <Analytics queries={queries} />
      ) : (
        <>
          {/* Filters and Search */}
          <div className="controls-section">
            <div className="search-filters">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search by name, email, service, or message..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <span className="search-icon">🔍</span>
              </div>
              
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Rejected">Rejected</option>
              </select>

              <select 
                value={serviceFilter} 
                onChange={(e) => setServiceFilter(e.target.value)}
                className="filter-select"
              >
                <option value="All">All Services</option>
                {getUniqueServices().map(service => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </select>
            </div>

            {/* Bulk Actions */}
            {showBulkActions && (
              <div className="bulk-actions">
                <span>{selectedQueries.size} selected</span>
                <button onClick={() => handleBulkStatusChange("Resolved")} className="bulk-btn resolved">
                  Mark Resolved
                </button>
                <button onClick={() => handleBulkStatusChange("In Progress")} className="bulk-btn in-progress">
                  Mark In Progress
                </button>
                <button onClick={() => handleBulkStatusChange("Rejected")} className="bulk-btn rejected">
                  Mark Rejected
                </button>
                <button onClick={clearSelection} className="bulk-btn clear">
                  Clear Selection
                </button>
              </div>
            )}
          </div>

          {/* Results Info */}
          <div className="results-info">
            <span>Showing {paginatedQueries.length} of {queries.length} queries</span>
            <div className="table-actions">
              <button onClick={selectAllQueries} className="select-all-btn">
                Select All
              </button>
            </div>
          </div>

          {/* Enhanced Table */}
          <div className="table-container">
            <table className="queries-table">
              <thead>
                <tr>
                  <th>
                    <input 
                      type="checkbox" 
                      onChange={(e) => e.target.checked ? selectAllQueries() : clearSelection()}
                      checked={selectedQueries.size === filteredQueries.length && filteredQueries.length > 0}
                    />
                  </th>
                  <th onClick={() => handleSort('id')} className="sortable">
                    ID {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('submitted_at')} className="sortable">
                    Date & Time {sortConfig.key === 'submitted_at' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('name')} className="sortable">
                    Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th onClick={() => handleSort('service')} className="sortable">
                    Service {sortConfig.key === 'service' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('cost')} className="sortable">
                    Cost {sortConfig.key === 'cost' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedQueries.map((query, idx) => (
                  <React.Fragment key={query.id}>
                    <tr 
                      className={`query-row ${selectedQueries.has(query.id) ? 'selected' : ''} ${expandedRows.has(query.id) ? 'expanded' : ''}`}
                    >
                      <td>
                        <input 
                          type="checkbox" 
                          checked={selectedQueries.has(query.id)}
                          onChange={() => toggleQuerySelection(query.id)}
                        />
                      </td>
                      <td className="id-cell">{idx + 1}</td> {/* ID starts from 1 on each page */}
                      <td className="date-cell">{formatDateTime(query.submitted_at)}</td>
                      <td className="name-cell">{query.name}</td>
                      <td className="email-cell">
                        <a href={`mailto:${query.email}`} className="email-link">
                          {query.email}
                        </a>
                      </td>
                      <td className="phone-cell">
                        <a href={`tel:${query.phone}`} className="phone-link">
                          {query.phone}
                        </a>
                      </td>
                      <td className="service-cell">
                        <span className="service-badge">{query.service}</span>
                      </td>
                      <td className="cost-cell">
                        <span className="cost-amount">₹{query.cost?.toFixed(2) || "0.00"}</span>
                      </td>
                      <td className="status-cell">
                        <select
                          value={query.status || "Pending"}
                          className="status-select"
                          style={{
                            backgroundColor: getStatusColor(query.status),
                          }}
                          onChange={(e) => handleStatusChange(query.id, e.target.value)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Resolved">Resolved</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </td>
                      <td className="actions-cell">
                        <button 
                          onClick={() => toggleRowExpansion(query.id)}
                          className="expand-btn"
                          title="View Details"
                        >
                          {expandedRows.has(query.id) ? '▼' : '▶'}
                        </button>
                      </td>
                    </tr>
                    {expandedRows.has(query.id) && (
                      <tr className="expanded-details">
                        <td colSpan="12">
                          <div className="query-details">
                            <div className="detail-section">
                              <h4>Contact Information</h4>
                              <div className="contact-grid">
                                <div>
                                  <strong>Email:</strong> 
                                  <a href={`mailto:${query.email}`}>{query.email}</a>
                                </div>
                                <div>
                                  <strong>Phone:</strong> 
                                  <a href={`tel:${query.phone}`}>{query.phone}</a>
                                </div>
                              </div>
                            </div>
                            <div className="detail-section">
                              <h4>Service Details</h4>
                              <div className="service-grid">
                                <div><strong>Primary Service:</strong> {query.service}</div>
                                <div><strong>Total Cost:</strong> ₹{query.cost?.toFixed(2) || "0.00"}</div>
                                <div><strong>Submitted:</strong> {formatDateTime(query.submitted_at)}</div>
                                <div>
                                  <strong>Status:</strong> 
                                  <span className={`status-badge ${query.status?.toLowerCase().replace(' ', '-')}`}>
                                    {getStatusIcon(query.status)} {query.status || "Pending"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="detail-section">
                              <div className="services-tags">
                                {query.cameraRequired && <span className="service-tag">📷 Camera</span>}
                                {query.vehicleRequired && <span className="service-tag">🚗 Vehicle</span>}
                                {query.firstAid && <span className="service-tag">🏥 First Aid</span>}
                                {query.walkieTalkie && <span className="service-tag">📻 Walkie Talkie</span>}
                                {query.bulletProof && <span className="service-tag">🛡️ Bullet Proof</span>}
                                {query.fireSafety && <span className="service-tag">🔥 Fire Safety</span>}
                              </div>
                            </div>
                            <div className="detail-section">
                              <h4>Message</h4>
                              <p>{query.message}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {filteredQueries.length === 0 && (
            <div className="empty-state">
              <h3>No queries found</h3>
              <p>Try adjusting your search criteria or filters.</p>
            </div>
          )}

          {/* Pagination Controls */}
          <div className="pagination-controls" style={{ display: "flex", justifyContent: "center", margin: "24px 0" }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ marginRight: 8 }}
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={currentPage === i + 1 ? "active-page" : ""}
                style={{
                  margin: "0 4px",
                  fontWeight: currentPage === i + 1 ? "bold" : "normal",
                  background: currentPage === i + 1 ? "#667eea" : "#fff",
                  color: currentPage === i + 1 ? "#fff" : "#222",
                  borderRadius: 4,
                  border: "1px solid #ccc",
                  padding: "4px 12px",
                  cursor: "pointer"
                }}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{ marginLeft: 8 }}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;