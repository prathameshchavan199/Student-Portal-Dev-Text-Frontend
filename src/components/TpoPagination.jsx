import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function TpoPagination({ page, totalPages, total, shownFrom, shownTo, onPageChange }) {
  const safeTotalPages = Math.max(1, totalPages);
  const windowStart = Math.max(0, Math.min(page - 1, safeTotalPages - 3));
  const pageNumbers = Array.from({ length: Math.min(3, safeTotalPages) }, (_, i) => windowStart + i);

  return (
    <div className="tpo-pagination">
      <span>
        Showing {shownFrom} to {shownTo} of {total}
      </span>
      <div className="tpo-pagination-controls">
        <button type="button" disabled={page === 0} onClick={() => onPageChange(Math.max(0, page - 1))}>
          <FiChevronLeft />
        </button>
        {pageNumbers.map((p) => (
          <button
            key={p}
            type="button"
            className={`tpo-page-number ${p === page ? 'active' : ''}`}
            onClick={() => onPageChange(p)}
          >
            {p + 1}
          </button>
        ))}
        <button type="button" disabled={page + 1 >= safeTotalPages} onClick={() => onPageChange(page + 1)}>
          <FiChevronRight />
        </button>
      </div>
    </div>
  );
}
