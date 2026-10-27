export function ChartLegend({ showRange }: { showRange: boolean }) {
  return (
    <div className="legend">
      <span className="legend__item legend__item--forecast">Forecast you had</span>
      <span className="legend__item legend__item--actual">What actually blew</span>
      {showRange && <span className="legend__item legend__item--range">Likely range (8 in 10 hours)</span>}
    </div>
  );
}
