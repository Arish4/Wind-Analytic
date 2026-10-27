export function Footer() {
  return (
    <footer className="footer">
      <div>
        <strong>Method</strong>
        <p>
          For each delivery hour we take the newest Elexon WINDFOR forecast published before the decision cutoff on
          the previous day and compare it with metered FUELHH wind output for the same hour (UK local time).
        </p>
      </div>
      <div>
        <strong>Data</strong>
        <p>
          Elexon BMRS · datasets FUELHH (fuelType WIND) and WINDFOR. Pilot scope: purchase decisions made in January
          2026 (delivery 2 Jan – 1 Feb).
        </p>
      </div>
    </footer>
  );
}
