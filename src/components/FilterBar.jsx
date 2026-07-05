/**
 * src/components/FilterBar.jsx
 *
 * Thanh tìm kiếm và lọc theo trạng thái (controlled component).
 * Toàn bộ state và debounce logic sống ở App.jsx.
 *
 * Props:
 *   activeStatus   {'all'|'pending'|'completed'} — tab đang chọn
 *   keyword        {string}                       — giá trị ô tìm kiếm hiện tại
 *   onStatusChange {(status: string) => void}
 *   onKeywordChange{(keyword: string) => void}
 *   total          {number}                       — tổng kết quả hiện tại
 *   loading        {boolean}
 */

import './FilterBar.css';

const STATUS_TABS = [
  { value: 'all',       label: 'Tất cả'      },
  { value: 'pending',   label: 'Đang chờ'    },
  { value: 'completed', label: 'Hoàn thành'  },
];

const SORT_OPTIONS = [
  { value: 'created_at:desc', label: 'Mới nhất' },
  { value: 'created_at:asc',  label: 'Cũ nhất' },
  { value: 'title:asc',       label: 'Tiêu đề (A-Z)' },
  { value: 'title:desc',      label: 'Tiêu đề (Z-A)' },
  { value: 'updated_at:desc', label: 'Cập nhật gần đây' },
  { value: 'status:asc',      label: 'Đang chờ trước' },
  { value: 'status:desc',     label: 'Hoàn thành trước' },
];

export default function FilterBar({
  activeStatus,
  keyword,
  onStatusChange,
  onKeywordChange,
  sortBy,
  sortOrder,
  onSortChange,
  total,
  loading,
}) {
  const hasFilters = activeStatus !== 'all' || keyword.trim().length > 0;
  const activeSortValue = `${sortBy}:${sortOrder}`;

  const handleSortSelect = (e) => {
    const [newSortBy, newSortOrder] = e.target.value.split(':');
    onSortChange(newSortBy, newSortOrder);
  };

  return (
    <div className="filter-bar">
      {/* Ô tìm kiếm */}
      <div className="filter-bar__search-wrapper">
        <span className="filter-bar__search-icon" aria-hidden="true">
          {/* Magnifying glass SVG — không dùng emoji để đồng nhất font */}
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M10 6.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm-.747 3.56a5 5 0 1 1 1.06-1.06l2.594 2.593a.75.75 0 1 1-1.06 1.06L9.253 10.06Z"
              fill="currentColor"
              fillRule="evenodd"
              clipRule="evenodd"
            />
          </svg>
        </span>

        <input
          id="filter-search-input"
          type="search"
          className="filter-bar__search-input"
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          placeholder="Tìm kiếm theo tiêu đề..."
          aria-label="Tìm kiếm công việc"
          autoComplete="off"
          spellCheck="false"
        />

        {/* Nút xóa tìm kiếm — hiện khi có keyword */}
        {keyword && (
          <button
            id="btn-clear-search"
            className="filter-bar__clear-btn"
            onClick={() => onKeywordChange('')}
            aria-label="Xóa tìm kiếm"
            title="Xóa tìm kiếm"
            type="button"
          >
            ✕
          </button>
        )}

        {/* Loading indicator khi đang fetch */}
        {loading && (
          <span className="filter-bar__loading-dot" aria-label="Đang tải..." />
        )}
      </div>

      {/* Status tabs */}
      <div className="filter-bar__bottom-row">
        <div className="filter-bar__tabs" role="tablist" aria-label="Lọc theo trạng thái">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              id={`filter-tab-${tab.value}`}
              role="tab"
              aria-selected={activeStatus === tab.value}
              className={`filter-bar__tab ${activeStatus === tab.value ? 'filter-bar__tab--active' : ''}`}
              onClick={() => onStatusChange(tab.value)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="filter-bar__actions-wrapper">
          {/* Sắp xếp dropdown */}
          <div className="filter-bar__sort-container">
            <span className="filter-bar__sort-icon" aria-hidden="true">⇅</span>
            <select
              id="filter-sort-select"
              className="filter-bar__sort-select"
              value={activeSortValue}
              onChange={handleSortSelect}
              aria-label="Sắp xếp công việc"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Kết quả đếm — chỉ hiện khi không đang load */}
          {!loading && (
            <span className="filter-bar__result-count">
              {hasFilters
                ? `${total} kết quả`
                : `${total} công việc`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
